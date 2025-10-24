const pool = require("../config/db");

// ============ CREATE ============
// Tạo phiếu mượn mới + chi tiết
const createBorrow = async (user_id, borrow_date, due_date, recordIds) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Kiểm tra tổng số sách bạn đọc đang mượn (active)
    const [[{ currentCount }]] = await conn.query(
      `
      SELECT COUNT(bd.id) as currentCount
      FROM borrow_details bd
      JOIN borrows b ON bd.borrow_id = b.id
      WHERE b.user_id = ? 
        AND b.status = 'active' 
        AND bd.status = 'on_loan'
      `,
      [user_id]
    );

    if (currentCount + recordIds.length > 6) {
      throw new Error(
        "Một bạn đọc chỉ được mượn tối đa 6 quyển tại một thời điểm"
      );
    }

    // 2. Tạo phiếu mượn
    const [borrowResult] = await conn.query(
      `INSERT INTO borrows (user_id, borrow_date, due_date, status) 
       VALUES (?, ?, ?, 'active')`,
      [user_id, borrow_date, due_date]
    );
    const borrowId = borrowResult.insertId;

    // 3. Lặp để thêm chi tiết mượn
    for (let record of recordIds) {
      const { recordId, reservationId, reservationDetailId } = record;

      // Kiểm tra record
      const [[rec]] = await conn.query(
        `SELECT status FROM records WHERE id = ?`,
        [recordId]
      );
      if (!rec) throw new Error("Record không tồn tại");

      if (reservationId) {
        if (rec.status !== "on_hold")
          throw new Error("Sách đặt giữ chưa ở trạng thái on_hold");

        // cập nhật chi tiết giữ sang picked_up
        await conn.query(
          `UPDATE reservation_details 
           SET status = 'picked_up', picked_up_actual_at = ? 
           WHERE id = ?`,
          [borrow_date, reservationDetailId]
        );

        // nếu tất cả chi tiết đã picked_up hoặc cancelled thì reservation completed
        await conn.query(
          `
          UPDATE reservations r 
          SET status = 'completed'
          WHERE r.id = ? 
            AND NOT EXISTS (
              SELECT 1 FROM reservation_details rd 
              WHERE rd.reservation_id = r.id 
              AND rd.status IN ('pending','on_hold')
            )
        `,
          [reservationId]
        );
      } else {
        if (rec.status !== "available") throw new Error("Sách không khả dụng");
      }

      // Thêm chi tiết mượn
      await conn.query(
        `INSERT INTO borrow_details (borrow_id, record_id, reservation_id, status) 
         VALUES (?, ?, ?, 'on_loan')`,
        [borrowId, recordId, reservationId || null]
      );

      // Cập nhật record sang on_loan
      await conn.query(`UPDATE records SET status = 'on_loan' WHERE id = ?`, [
        recordId,
      ]);
    }

    await conn.commit();
    return { borrowId, user_id, borrow_date, due_date, recordIds };
  } catch (error) {
    await conn.rollback();
    throw error;
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
           CASE WHEN bd.reservation_id IS NOT NULL THEN 'Mượn online' ELSE 'Mượn tại chỗ' END as borrow_type
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
    SET bd.status = 'overdued'
    WHERE bd.status = 'on_loan' AND b.due_date < CURDATE()
  `);
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
};
