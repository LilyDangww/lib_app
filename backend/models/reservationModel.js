const pool = require("../config/db");

// Tạo phiếu giữ và chi tiết cùng lúc
const createReservationWithDetails = async (
  user_id,
  hold_type = "hard", // gán mặc định hard nếu không truyền
  record_ids,
  note = null
) => {
  if (!record_ids || record_ids.length === 0) {
    throw new Error("Cần chọn ít nhất 1 bản ghi để giữ");
  }
  if (record_ids.length > 2) {
    throw new Error("Một phiếu giữ chỉ được phép tối đa 2 bản ghi");
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Kiểm tra số lượng sách user đang giữ (chưa completed/cancelled)
    const [activeHold] = await conn.query(
      `
      SELECT COUNT(rd.id) AS cnt
      FROM reservation_tickets rt
      JOIN reservation_details rd ON rt.id = rd.reservation_id
      WHERE rt.user_id = ?
        AND rt.status IN ('processing','on_hold')
        AND rd.status IN ('pending','on_hold')
      `,
      [user_id]
    );

    if (activeHold[0].cnt + record_ids.length > 2) {
      throw new Error(
        "Một người dùng chỉ được phép giữ tối đa 2 bản ghi tại một thời điểm"
      );
    }

    // Tạo phiếu giữ
    const [ticketResult] = await conn.query(
      `INSERT INTO reservation_tickets (user_id, hold_type, status, request_date, note)
       VALUES (?, ?, 'processing', NOW(), ?)`,
      [user_id, hold_type, note]
    );

    const reservationId = ticketResult.insertId;

    // Thêm chi tiết giữ cho từng record
    for (let record_id of record_ids) {
      // Kiểm tra record phải available
      const [[record]] = await conn.query(
        `SELECT status FROM records WHERE id = ?`,
        [record_id]
      );

      if (!record) throw new Error(`Record ${record_id} không tồn tại`);
      if (record.status !== "available") {
        throw new Error(`Record ${record_id} không khả dụng`);
      }

      // Insert chi tiết giữ
      await conn.query(
        `INSERT INTO reservation_details (reservation_id, record_id, status, hold_start_at, default_expire_at)
         VALUES (?, ?, 'pending', NULL, NULL)`,
        [reservationId, record_id]
      );
      // Cập nhật trạng thái record -> reserved_pending
      await conn.query(
        `UPDATE records SET status = 'reserved_pending' WHERE id = ?`,
        [record_id]
      );
    }

    await conn.commit();
    return { reservationId, record_ids, hold_type };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

// Lấy phiếu giữ kèm chi tiết giữ (có lọc trạng thái + sắp xếp ngày)
const getReservationWithDetails = async (id, status = null, sort = "DESC") => {
  const [ticketRows] = await pool.query(
    `SELECT r.id AS reservation_id, r.user_id, u.username, r.hold_type, 
            r.status AS ticket_status, r.request_date, r.note
     FROM reservation_tickets r 
     JOIN users u ON r.user_id = u.id 
     WHERE r.id = ?`,
    [id]
  );

  if (ticketRows.length === 0) return null;

  const ticket = ticketRows[0];

  // Chi tiết giữ
  let query = `
    SELECT 
      rd.id AS detail_id,
      rd.record_id,
      r.barcode,
      d.name AS book_title,
      a.name AS author_name,
      rd.status AS detail_status,
      rd.hold_start_at,
      rd.default_expire_at
    FROM reservation_details rd
    JOIN records r ON rd.record_id = r.id
    JOIN documents d ON r.doc_id = d.id
    LEFT JOIN doc_author da ON d.id = da.doc_id
    LEFT JOIN authors a ON da.author_id = a.id
    WHERE rd.reservation_id = ?
  `;
  const params = [id];

  if (status) {
    query += " AND rd.status = ?";
    params.push(status);
  }

  // sort: DESC (mặc định) hoặc ASC
  query += ` ORDER BY rd.hold_start_at ${sort === "ASC" ? "ASC" : "DESC"}`;

  const [details] = await pool.query(query, params);
  ticket.details = details;

  return ticket;
};

const confirmReservationDetails = async (reservation_id) => {
  await pool.query(
    `UPDATE reservation_details
     SET status = 'on_hold',
         hold_start_at = NOW(),
         default_expire_at = DATE_ADD(NOW(), INTERVAL 2 DAY)
     WHERE reservation_id = ? AND status = 'pending'`,
    [reservation_id]
  );
};
const updateReservationDetailById = async (detail_id, newStatus) => {
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
    if (newStatus === "on_hold") {
      await conn.query(
        `UPDATE reservation_details rd
         JOIN records r ON rd.record_id = r.id
         SET rd.status = 'on_hold',
             rd.hold_start_at = NOW(),
             rd.default_expire_at = DATE_ADD(NOW(), INTERVAL 2 DAY),
             r.status = 'on_hold'
         WHERE rd.id = ?`,
        [detail_id]
      );

      // Ticket sang active
      await conn.query(
        `UPDATE reservation_tickets 
         SET status = 'active' 
         WHERE id = ?`,
        [detail.reservation_id]
      );
    } else if (newStatus === "picked_up") {
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
             r.status = 'available'
         WHERE rd.id = ?`,
        [newStatus, detail_id]
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
// Lấy danh sách phiếu giữ của 1 user kèm chi tiết (lọc trạng thái + khoảng thời gian)
const getUserReservationsWithDetails = async (
  user_id,
  status = null,
  startDate = null,
  endDate = null,
  sort = "DESC"
) => {
  let query = `
    SELECT 
      rt.id AS reservation_id,
      rt.user_id,
      rt.hold_type,
      rt.status AS ticket_status,
      rt.request_date,
      rt.note,

      rd.id AS detail_id,
      rd.status AS detail_status,
      rd.hold_start_at,
      rd.default_expire_at,

      r.barcode,
      d.name AS book_title
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

  if (startDate && endDate) {
    query += " AND DATE(rt.request_date) BETWEEN ? AND ?";
    params.push(startDate, endDate);
  }

  query += ` ORDER BY rt.request_date ${sort === "ASC" ? "ASC" : "DESC"}`;

  const [rows] = await pool.query(query, params);
  return rows;
};
// Lấy danh sách phiếu giữ cho thủ thư (lọc trạng thái + khoảng thời gian)
const getAllReservationsWithDetailsForLibrarian = async (
  status = null,
  startDate = null,
  endDate = null,
  sort = "DESC"
) => {
  let query = `
    SELECT 
      rt.id AS reservation_id,
      rt.user_id,
      u.username AS user_name,
      rt.hold_type,
      rt.status AS ticket_status,
      rt.request_date,
      rt.note,

      rd.id AS detail_id,
      rd.status AS detail_status,
      rd.hold_start_at,
      rd.default_expire_at,

      r.barcode,
      d.name AS book_title
    FROM reservation_tickets rt
    JOIN users u ON rt.user_id = u.id
    JOIN reservation_details rd ON rt.id = rd.reservation_id
    JOIN records r ON rd.record_id = r.id
    JOIN documents d ON r.doc_id = d.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    query += " AND rd.status = ?";
    params.push(status);
  }

  if (startDate && endDate) {
    query += " AND DATE(rt.request_date) BETWEEN ? AND ?";
    params.push(startDate, endDate);
  }

  query += ` ORDER BY rt.request_date ${sort === "ASC" ? "ASC" : "DESC"}`;

  const [rows] = await pool.query(query, params);
  return rows;
};

module.exports = {
  createReservationWithDetails,
  confirmReservationDetails,
  updateReservationDetailById,
  deleteReservation,
  getReservationWithDetails,
  getUserReservationsWithDetails,
  getAllReservationsWithDetailsForLibrarian,
};
