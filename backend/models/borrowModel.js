const pool = require("../config/db");

const createBorrow = async (user_id, records) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const borrow_date = new Date();
    const due_date = new Date();
    due_date.setDate(borrow_date.getDate() + 35);

    if (!Array.isArray(records) || records.length === 0) {
      throw new Error("Cần chọn ít nhất 1 bản ghi để mượn");
    }

    // 1️⃣ Kiểm tra tổng số sách đang mượn
    const [[{ currentCount }]] = await conn.query(
      `
      SELECT COUNT(bd.id) AS currentCount
      FROM borrow_details bd
      JOIN borrow_tickets b ON bd.borrow_id = b.id
      WHERE b.user_id = ?
        AND b.status = 'active'
        AND bd.status = 'on_loan'
    `,
      [user_id]
    );

    if (currentCount + records.length > 6) {
      throw new Error(
        "Một bạn đọc chỉ được mượn tối đa 6 quyển tại một thời điểm"
      );
    }

    // 2️⃣ Tạo phiếu mượn cha
    const [borrowResult] = await conn.query(
      `INSERT INTO borrow_tickets (user_id, borrow_date, due_date, status)
       VALUES (?, ?, ?, 'active')`,
      [user_id, borrow_date, due_date]
    );
    const borrowId = borrowResult.insertId;

    // 3️⃣ Xử lý từng sách trong danh sách yêu cầu mượn
    for (const item of records) {
      let recordId = null;
      let reservationDetailId = null; // <-- cái này sẽ được lưu vào borrow_details
      let reservationId = null; // <-- dùng để auto close phiếu giữ nếu cần

      // ----- Trường hợp mượn từ phiếu giữ -----
      if (item.reservation_detail_id) {
        reservationDetailId = item.reservation_detail_id;

        // Lấy thông tin chi tiết giữ
        const [[detail]] = await conn.query(
          `
          SELECT 
            rd.record_id,
            rd.reservation_id,
            rd.status AS detail_status,
            r.status AS record_status
          FROM reservation_details rd
          JOIN records r ON rd.record_id = r.id
          WHERE rd.id = ?
        `,
          [reservationDetailId]
        );

        if (!detail) {
          throw new Error(`Chi tiết giữ ${reservationDetailId} không tồn tại`);
        }

        if (detail.detail_status !== "on_hold") {
          throw new Error(
            `Chi tiết giữ ${reservationDetailId} chưa ở trạng thái on_hold`
          );
        }

        recordId = detail.record_id;
        reservationId = detail.reservation_id;

        // cập nhật chi tiết giữ -> picked_up
        await conn.query(
          `
          UPDATE reservation_details
          SET status = 'picked_up',
              pickup_actual_at = ?
          WHERE id = ?
        `,
          [borrow_date, reservationDetailId]
        );

        // nếu phiếu giữ không còn pending / on_hold nữa thì đóng phiếu
        await conn.query(
          `
          UPDATE reservation_tickets rt
          SET rt.status = 'closed'
          WHERE rt.id = ?
            AND NOT EXISTS (
              SELECT 1
              FROM reservation_details rd
              WHERE rd.reservation_id = rt.id
              AND rd.status IN ('pending','on_hold')
            )
        `,
          [reservationId]
        );
      }

      // ----- Trường hợp mượn tại chỗ (không thông qua giữ) -----
      else if (item.record_id) {
        recordId = item.record_id;
        const [[rec]] = await conn.query(
          `SELECT status FROM records WHERE id = ?`,
          [recordId]
        );

        if (!rec) {
          throw new Error(`Record ${recordId} không tồn tại`);
        }

        if (rec.status !== "available") {
          throw new Error(
            `Record ${recordId} không khả dụng để mượn (status=${rec.status})`
          );
        }
      } else {
        throw new Error(
          "Thiếu record_id hoặc reservation_detail_id cho một bản ghi trong records[]"
        );
      }

      // 4️⃣ Tạo dòng borrow_details với đúng FOREIGN KEY
      await conn.query(
        `
        INSERT INTO borrow_details (
          borrow_id,
          record_id,
          reservation_detail_id,
          status
        )
        VALUES (?, ?, ?, 'on_loan')
      `,
        [borrowId, recordId, reservationDetailId || null]
      );

      // 5️⃣ Cập nhật trạng thái bản ghi vật lý -> on_loan
      await conn.query(`UPDATE records SET status = 'on_loan' WHERE id = ?`, [
        recordId,
      ]);
    }

    await conn.commit();
    return {
      borrowId,
      user_id,
      borrow_date,
      due_date,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// ============ READ ============
// Danh sách phiếu mượn
const getBorrows = async (fromDate, toDate) => {
  let query = `
    SELECT b.id, u.username as user_name, b.borrow_date, b.due_date, b.status
    FROM borrow_tickets b
    JOIN users u ON b.user_id = u.id
    WHERE 1=1
  `;
  const params = [];
  if (fromDate) {
    query += ` AND b.borrow_date >= ?`;
    params.push(fromDate);
  }
  if (toDate) {
    query += ` AND b.borrow_date <= ?`;
    params.push(toDate);
  }
  query += ` ORDER BY b.borrow_date DESC`;

  const [rows] = await pool.query(query, params);
  return rows;
};

// Lấy chi tiết phiếu mượn (reader hoặc librarian)
const getBorrowById = async (id) => {
  const [rows] = await pool.query(
    `
    SELECT bd.id as borrow_detail_id, d.name as document_name, 
           b.borrow_date, b.due_date, bd.status,
           CASE WHEN bd.reservation_detail_id IS NOT NULL THEN 'Mượn online' ELSE 'Mượn tại chỗ' END as borrow_type
    FROM borrow_details bd
    JOIN borrow_tickets b ON bd.borrow_id = b.id
    JOIN records r ON bd.record_id = r.id
    JOIN documents d ON r.doc_id = d.id
    WHERE b.id = ?
  `,
    [id]
  );

  return rows;
};

// Danh sách chi tiết mượn của user hiện thời (ưu tiên chi tiết + thông tin sách/record)
const getBorrowsByUser = async (userId, fromDate, toDate) => {
  let sql = `
    SELECT
      b.id AS borrow_id,
      bd.id AS borrow_detail_id,
      b.borrow_date,
      b.due_date,
      bd.status,
      bd.return_date,
      bd.reservation_detail_id,
      d.id AS doc_id,
      d.name AS document_name,
      r.id AS record_id,
      r.barcode AS record_code
    FROM borrow_tickets b
    JOIN borrow_details bd ON bd.borrow_id = b.id
    JOIN records r ON r.id = bd.record_id
    JOIN documents d ON d.id = r.doc_id
    WHERE b.user_id = ?
  `;
  const params = [userId];

  if (fromDate) {
    sql += ` AND b.borrow_date >= ?`;
    params.push(fromDate);
  }
  if (toDate) {
    sql += ` AND b.borrow_date <= ?`;
    params.push(toDate);
  }

  sql += ` ORDER BY b.borrow_date DESC, bd.id DESC`;

  const [rows] = await pool.query(sql, params);
  return rows;
};

// ============ UPDATE ============
// Chỉ cập nhật trạng thái (không cho gia hạn)
const updateBorrowStatus = async (id, status) => {
  await pool.query(`UPDATE borrow_tickets SET status = ? WHERE id = ?`, [
    status,
    id,
  ]);
  return getBorrowById(id);
};

// Auto update overdue
const autoUpdateOverdue = async () => {
  await pool.query(`
    UPDATE borrow_details bd
    JOIN borrow_tickets b ON bd.borrow_id = b.id
    SET bd.status = 'expired'
    WHERE bd.status = 'on_loan' AND b.due_date < CURDATE()
  `);
};

const updateBorrowTicketStatus = async (borrowId) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query(
      `SELECT status FROM borrow_details WHERE borrow_id = ?`,
      [borrowId]
    );

    // Không có chi tiết -> giữ nguyên
    if (!rows || rows.length === 0) {
      await conn.commit();
      return;
    }

    const allClosed = rows.every(
      (d) => d.status === "returned" || d.status === "lost"
    );

    if (allClosed) {
      await conn.query(
        `UPDATE borrow_tickets SET status = 'closed' WHERE id = ?`,
        [borrowId]
      );
    } else {
      // Chỉ set 'active' nếu khác 'active'
      const [[ticket]] = await conn.query(
        `SELECT status FROM borrow_tickets WHERE id = ?`,
        [borrowId]
      );
      if (ticket && ticket.status !== "active") {
        await conn.query(
          `UPDATE borrow_tickets SET status = 'active' WHERE id = ?`,
          [borrowId]
        );
      }
    }

    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

// Trả sách: chỉ xử lý chi tiết và bản ghi, KHÔNG gọi updateBorrowTicketStatus tại model
const returnBook = async (borrowDetailId) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[detail]] = await conn.query(
      `SELECT bd.id, bd.borrow_id, bd.record_id, bd.status
       FROM borrow_details bd
       WHERE bd.id = ?`,
      [borrowDetailId]
    );
    if (!detail) throw new Error("Chi tiết mượn không tồn tại");
    if (detail.status !== "on_loan")
      throw new Error("Chi tiết mượn không ở trạng thái on_loan");

    await conn.query(
      `UPDATE borrow_details
       SET status = 'returned', return_date = CURDATE()
       WHERE id = ?`,
      [borrowDetailId]
    );

    await conn.query(`UPDATE records SET status = 'available' WHERE id = ?`, [
      detail.record_id,
    ]);

    await conn.commit();

    // Trả về borrow_id để controller tự gọi updateBorrowTicketStatus
    return {
      borrowId: detail.borrow_id,
      detailId: detail.id,
      recordId: detail.record_id,
    };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

// ============ DELETE (close) ============
const closeBorrow = async (id) => {
  await pool.query(`UPDATE borrow_tickets SET status = 'closed' WHERE id = ?`, [
    id,
  ]);
};

module.exports = {
  createBorrow,
  getBorrows,
  getBorrowById,
  updateBorrowStatus,
  autoUpdateOverdue,
  closeBorrow,
  updateBorrowTicketStatus,
  returnBook,
  getBorrowsByUser, // added
};
