const pool = require("../config/db");

const createReservationWithDetails = async (
  user_id,
  document_ids,
  note = null
) => {
  if (!document_ids || document_ids.length === 0) {
    throw new Error("Cần chọn ít nhất 1 tài liệu để giữ");
  }
  if (document_ids.length > 2) {
    throw new Error("Một phiếu giữ chỉ được phép tối đa 2 tài liệu");
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Kiểm tra tổng số sách user đang giữ hoặc đang chờ duyệt
    const [activeHold] = await conn.query(
      `
      SELECT COUNT(rd.id) AS cnt
      FROM reservation_tickets rt
      JOIN reservation_details rd ON rt.id = rd.reservation_id
      WHERE rt.user_id = ?
        AND rt.status NOT IN ('closed', 'cancelled')
        AND rd.status IN ('pending', 'on_hold')
      `,
      [user_id]
    );

    const totalHolding = activeHold[0].cnt + document_ids.length;
    if (totalHolding > 2) {
      throw new Error(
        `Người dùng này đã giữ ${activeHold[0].cnt} bản ghi, chỉ có thể giữ tối đa 2 bản ghi cùng lúc.`
      );
    }

    // ✅ Tạo phiếu giữ – đã bỏ cột hold_type
    const [ticketResult] = await conn.query(
      `INSERT INTO reservation_tickets (user_id, status, request_date, note)
       VALUES (?, 'processing', NOW(), ?)`,
      [user_id, note]
    );

    const reservationId = ticketResult.insertId;
    const reservedRecordIds = [];

    // Thêm chi tiết giữ cho từng tài liệu
    for (let doc_id of document_ids) {
      const [[record]] = await conn.query(
        `SELECT id, status 
         FROM records 
         WHERE doc_id = ? AND status = 'available' 
         LIMIT 1 FOR UPDATE`,
        [doc_id]
      );

      if (!record) {
        throw new Error(
          `Không tìm thấy bản ghi khả dụng cho tài liệu ${doc_id}`
        );
      }

      const record_id = record.id;
      reservedRecordIds.push(record_id);

      await conn.query(
        `INSERT INTO reservation_details (reservation_id, record_id, status, hold_start_at, default_expire_at)
         VALUES (?, ?, 'pending', NULL, NULL)`,
        [reservationId, record_id]
      );

      await conn.query(
        `UPDATE records SET status = 'reserved_pending' WHERE id = ?`,
        [record_id]
      );
    }

    await conn.commit();
    // không cần trả hold_type nữa
    return { reservationId, record_ids: reservedRecordIds };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

const getReservationWithDetailsById = async (id) => {
  const [rows] = await pool.query(
    `
    SELECT 
        rt.id AS reservation_id,
        rt.user_id, 
        u.username AS user_name,
        rt.status AS ticket_status,
        rt.request_date,
        rt.note,
        rd.id AS detail_id,
        rd.record_id,
        r.barcode,
        d.name AS book_title,
        d.image_url AS image_url,
        rd.status AS detail_status,
        rd.hold_start_at,
        rd.default_expire_at,
        rd.cancel_reason
     FROM reservation_tickets rt
     JOIN users u ON rt.user_id = u.id  
     JOIN reservation_details rd ON rt.id = rd.reservation_id
     JOIN records r ON rd.record_id = r.id
     JOIN documents d ON r.doc_id = d.id
     WHERE rt.id = ?`,
    [id]
  );
  return rows;
};

const getReservationDetailBasicById = async (detail_id) => {
  const [rows] = await pool.query(
    `
    SELECT rd.id AS detail_id, rd.reservation_id, rd.status AS detail_status, rt.user_id
    FROM reservation_details rd
    JOIN reservation_tickets rt ON rd.reservation_id = rt.id
    WHERE rd.id = ?
    `,
    [detail_id]
  );
  return rows[0] || null;
};

const getReservationById = async (id) => {
  const [rows] = await pool.query(
    `SELECT 
        rt.id AS reservation_id,
        rt.user_id,
        u.username AS user_name,
        rt.status AS ticket_status,
        rt.request_date,
        rt.note
     FROM reservation_tickets rt
     JOIN users u ON rt.user_id = u.id
     WHERE rt.id = ?`,
    [id]
  );
  return rows[0] || null;
};

// Xác nhận chi tiết giữ (thủ thư)
const confirmReservationDetails = async (reservation_id) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Cập nhật chi tiết giữ + record
    await conn.query(
      `UPDATE reservation_details rd
       JOIN records r ON rd.record_id = r.id
       SET rd.status = 'on_hold',
           rd.hold_start_at = NOW(),
           rd.default_expire_at = DATE_ADD(NOW(), INTERVAL 2 DAY),
           r.status = 'on_hold'
       WHERE rd.reservation_id = ? AND rd.status = 'pending'`,
      [reservation_id]
    );

    // Cập nhật trạng thái phiếu giữ
    await conn.query(
      `UPDATE reservation_tickets
       SET status = 'active'
       WHERE id = ?`,
      [reservation_id]
    );

    await conn.commit();
    return true;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

const updateReservationDetailById = async (detail_id, newStatus, cancelReason = null) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Lấy chi tiết giữ + bản ghi
    const [[detail]] = await conn.query(
      `SELECT rd.id AS detail_id, rd.reservation_id, rd.status AS detail_status, 
              r.id AS record_id, r.status AS record_status
       FROM reservation_details rd
       JOIN records r ON rd.record_id = r.id
       WHERE rd.id = ?`,
      [detail_id]
    );

    if (!detail) {
      throw new Error("Reservation detail not found");
    }

    // Cập nhật trạng thái chi tiết + record theo newStatus
    if (newStatus === "picked_up") {
      await conn.query(
        `UPDATE reservation_details rd
         JOIN records r ON rd.record_id = r.id
         SET rd.status = 'picked_up',
             r.status = 'borrowed'
         WHERE rd.id = ?`,
        [detail_id]
      );
    } else if (newStatus === "cancelled" || newStatus === "expired") {
      await conn.query(
        `UPDATE reservation_details rd
         JOIN records r ON rd.record_id = r.id
         SET rd.status = ?,
             r.status = 'available',
             rd.cancel_reason = ?
         WHERE rd.id = ?`,
        [newStatus, cancelReason, detail_id]
      );
    }

    // Kiểm tra nếu phiếu giữ đã hoàn thành (không còn pending/on_hold)
    await conn.query(
      `UPDATE reservation_tickets rt
       SET rt.status = 'closed'
       WHERE rt.id = ?
       AND NOT EXISTS (
         SELECT 1 FROM reservation_details rd
         WHERE rd.reservation_id = rt.id
         AND rd.status IN ('pending','on_hold')
       )`,
      [detail.reservation_id]
    );

    await conn.commit();
    return true;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

// Xoá phiếu giữ
const deleteReservation = async (id) => {
  await pool.query(`DELETE FROM reservation_details WHERE reservation_id = ?`, [
    id,
  ]);
  const [result] = await pool.query(
    `DELETE FROM reservation_tickets WHERE id = ?`,
    [id]
  );
  return result.affectedRows > 0;
};

// 🧍‍♀️ Lấy danh sách tất cả sách trong chi tiết giữ của user (lọc theo trạng thái)
const getUserHoldDetails = async (user_id, status = null) => {
  let query = `
    SELECT 
      rd.id AS detail_id,
      rt.id AS reservation_id,
      rt.request_date,
      rd.status AS detail_status,
      rd.hold_start_at,
      rd.default_expire_at,
      r.barcode,
      d.name AS book_title,
      d.image_url AS image_url
    FROM reservation_tickets rt
    JOIN reservation_details rd ON rt.id = rd.reservation_id
    JOIN records r ON rd.record_id = r.id
    JOIN documents d ON r.doc_id = d.id
    WHERE rt.user_id = ?
  `;
  const params = [user_id];

  if (status) {
    query += " AND rd.status = ?";
    params.push(status);
  }

  query += ` ORDER BY rt.request_date DESC`; // mới nhất lên đầu

  const [rows] = await pool.query(query, params);
  return rows;
};
// 📚 Lấy danh sách phiếu giữ (cho thủ thư) - lọc linh hoạt: user, trạng thái, ngày
const getReservationsWithDetails = async (
  user_id = null, // nếu có -> xem của 1 bạn đọc cụ thể
  status = null,
  startDate = null,
  endDate = null,
  userKeyword = null, // tìm theo tên, sđt, id
  sort = "DESC",
  page = 1,
  limit = 10
) => {
  const offset = (page - 1) * limit;
  
  // Build WHERE clause for count and data queries
  let whereClause = " WHERE 1=1";
  const params = [];
  const countParams = [];

  // 🔹 Nếu truyền user_id (xem lịch sử của một bạn đọc cụ thể)
  if (user_id) {
    whereClause += " AND rt.user_id = ?";
    params.push(user_id);
    countParams.push(user_id);
  }

  // 🔹 Lọc theo từ khóa người dùng (tên / sđt / id)
  if (userKeyword) {
    if (!isNaN(userKeyword)) {
      whereClause += " AND (u.phone LIKE ? OR u.id = ?)";
      params.push(`%${userKeyword}%`, userKeyword);
      countParams.push(`%${userKeyword}%`, userKeyword);
    } else {
      whereClause += " AND u.username LIKE ?";
      params.push(`%${userKeyword}%`);
      countParams.push(`%${userKeyword}%`);
    }
  }

  // 🔹 Lọc theo trạng thái chi tiết giữ
  if (status) {
    whereClause += " AND rd.status = ?";
    params.push(status);
    countParams.push(status);
  }

  // 🔹 Lọc theo khoảng thời gian (chuẩn, ngắn gọn)
  if (startDate || endDate) {
    const s = startDate ? `${startDate} 00:00:00` : "1970-01-01 00:00:00";
    const e = endDate ? `${endDate} 23:59:59` : "2999-12-31 23:59:59";
    whereClause += " AND rt.request_date BETWEEN ? AND ?";
    params.push(s, e);
    countParams.push(s, e);
  }

  // Count total records
  let countQuery = `
    SELECT COUNT(*) as total
    FROM reservation_tickets rt
    JOIN users u ON rt.user_id = u.id
    JOIN reservation_details rd ON rt.id = rd.reservation_id
    JOIN records r ON rd.record_id = r.id
    JOIN documents d ON r.doc_id = d.id
    ${whereClause}
  `;

  const [countResult] = await pool.query(countQuery, countParams);
  const total = countResult[0].total;
  const totalPages = Math.ceil(total / limit);

  // Get paginated data
  let query = `
    SELECT 
      rt.id AS reservation_id,
      rt.user_id,
      u.username AS user_name,
      u.phone AS user_phone,
      rt.status AS ticket_status,
      rt.request_date,
      rt.note,

      rd.id AS detail_id,
      rd.status AS detail_status,
      rd.hold_start_at,
      rd.default_expire_at,

      r.barcode,
      d.name AS book_title,
      d.image_url AS image_url
    FROM reservation_tickets rt
    JOIN users u ON rt.user_id = u.id
    JOIN reservation_details rd ON rt.id = rd.reservation_id
    JOIN records r ON rd.record_id = r.id
    JOIN documents d ON r.doc_id = d.id
    ${whereClause}
  `;

  // 🔹 Sắp xếp
  query += ` ORDER BY rt.request_date ${sort === "ASC" ? "ASC" : "DESC"}`;
  query += ` LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const [rows] = await pool.query(query, params);
  return { page, limit, total, totalPages, data: rows };
};

// Tự động hết hạn phiếu giữ (quá 2 ngày kể từ request_date)
const expireOverdueReservations = async () => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1️⃣ Lấy danh sách phiếu còn đang active hoặc processing đã quá 2 ngày
    const [overdueTickets] = await conn.query(`
      SELECT id 
      FROM reservation_tickets
      WHERE status IN ('processing', 'active')
      AND request_date < DATE_SUB(NOW(), INTERVAL 2 DAY)
    `);

    if (overdueTickets.length === 0) {
      await conn.commit();
      return { message: "Không có phiếu giữ nào quá hạn." };
    }

    // 2️⃣ Cập nhật từng phiếu
    for (const ticket of overdueTickets) {
      // Cập nhật chi tiết và record
      await conn.query(
        `
        UPDATE reservation_details rd
        JOIN records r ON rd.record_id = r.id
        SET rd.status = 'expired',
            r.status = 'available'
        WHERE rd.reservation_id = ?
          AND rd.status IN ('pending', 'on_hold')
      `,
        [ticket.id]
      );

      // Cập nhật phiếu sang closed (nếu không còn chi tiết giữ)
      await conn.query(
        `
        UPDATE reservation_tickets rt
        SET rt.status = 'closed'
        WHERE rt.id = ?
        AND NOT EXISTS (
          SELECT 1 FROM reservation_details rd
          WHERE rd.reservation_id = rt.id
          AND rd.status IN ('pending','on_hold')
        )
      `,
        [ticket.id]
      );
    }

    await conn.commit();
    return {
      message: `Đã hết hạn ${overdueTickets.length} phiếu giữ quá hạn.`,
    };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

// Auto-cancel reservations if not confirmed in 5 days (pending -> cancelled, records -> available)
const autoCancelPendingReservations = async () => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1) Cancel pending details older than 5 days and free records
    const [upd] = await conn.query(
      `
      UPDATE reservation_details rd
      JOIN reservation_tickets rt ON rd.reservation_id = rt.id
      JOIN records r ON rd.record_id = r.id
      SET rd.status = 'cancelled',
          r.status = 'available'
      WHERE rd.status = 'pending'
        AND rt.request_date < DATE_SUB(NOW(), INTERVAL 5 DAY)
      `
    );

    // 2) Close tickets that have no more pending/on_hold
    await conn.query(
      `
      UPDATE reservation_tickets rt
      SET rt.status = 'closed'
      WHERE rt.status IN ('processing','active')
        AND rt.request_date < DATE_SUB(NOW(), INTERVAL 5 DAY)
        AND NOT EXISTS (
          SELECT 1 FROM reservation_details rd
          WHERE rd.reservation_id = rt.id
            AND rd.status IN ('pending','on_hold')
        )
      `
    );

    await conn.commit();
    return { cancelled_details: upd.affectedRows || 0 };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

// 📚 Get all reservation tickets for librarian (no pagination, returns all data)
// Returns ticket-level data only, not details
const getAllReservationsForLibrarian = async () => {
  const query = `
    SELECT 
      rt.id AS reservation_id,
      rt.user_id,
      u.username AS user_name,
      u.phone AS user_phone,
      u.email AS user_email,
      rt.status AS ticket_status,
      rt.request_date,
      rt.note,
      COUNT(rd.id) AS total_details,
      SUM(CASE WHEN rd.status IN ('pending', 'on_hold') THEN 1 ELSE 0 END) AS active_details
    FROM reservation_tickets rt
    JOIN users u ON rt.user_id = u.id
    LEFT JOIN reservation_details rd ON rt.id = rd.reservation_id
    GROUP BY rt.id, rt.user_id, u.username, u.phone, u.email, rt.status, rt.request_date, rt.note
    ORDER BY 
      CASE rt.status
        WHEN 'processing' THEN 1
        WHEN 'active' THEN 2
        WHEN 'closed' THEN 3
        WHEN 'cancelled' THEN 4
        ELSE 5
      END,
      rt.request_date DESC
  `;

  const [rows] = await pool.query(query);
  return rows;
};

module.exports = {
  createReservationWithDetails,
  getReservationById,
  getReservationWithDetailsById,
  getReservationDetailBasicById,
  confirmReservationDetails,
  updateReservationDetailById,
  deleteReservation,
  getUserHoldDetails,
  getReservationsWithDetails,
  expireOverdueReservations,
  autoCancelPendingReservations,
  getAllReservationsForLibrarian,
};
