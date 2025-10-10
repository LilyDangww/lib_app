const pool = require("../config/db");
const { get } = require("../routes/documentRoutes");

// Lấy danh sách sách đã mượn của 1 user
const getBorrowedBooksByUser = async (userId, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  const [rows] = await pool.query(
    `
    SELECT bd.id as borrow_detail_id,
           d.name as document_name,
           GROUP_CONCAT(DISTINCT a.name SEPARATOR ', ') as authors,
           d.cover_image,
           b.borrow_date,
           b.due_date,
           bd.return_date,
           CASE 
             WHEN bd.return_date IS NULL AND CURDATE() > b.due_date THEN 'Quá hạn'
             WHEN bd.return_date IS NULL THEN 'Đang mượn'
             ELSE 'Đã trả'
           END as status,
           CASE 
             WHEN bd.return_date IS NULL AND CURDATE() > b.due_date 
             THEN DATEDIFF(CURDATE(), b.due_date) * 5000
             ELSE 0
           END as fine
    FROM borrow_details bd
    JOIN borrows b ON bd.borrow_id = b.id
    JOIN records r ON bd.record_id = r.id
    JOIN documents d ON r.doc_id = d.id
    LEFT JOIN doc_authors da ON d.id = da.doc_id
    LEFT JOIN authors a ON da.author_id = a.id
    WHERE b.user_id = ?
    GROUP BY bd.id
    ORDER BY b.borrow_date DESC
    LIMIT ? OFFSET ?
  `,
    [userId, limit, offset]
  );

  return rows;
};

// ============ CREATE ============
// Tạo phiếu mượn mới + chi tiết sách mượn
const createBorrow = async (user_id, borrow_date, due_date, recordIds) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Tạo phiếu mượn
    const [borrowResult] = await conn.query(
      `INSERT INTO borrows (user_id, borrow_date, due_date) VALUES (?, ?, ?)`,
      [user_id, borrow_date, due_date]
    );
    const borrowId = borrowResult.insertId;

    // Tạo chi tiết mượn cho từng quyển (record)
    for (let recordId of recordIds) {
      await conn.query(
        `INSERT INTO borrow_details (borrow_id, record_id) VALUES (?, ?)`,
        [borrowId, recordId]
      );

      // Cập nhật trạng thái record sang "on_loan"
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
const getBorrows = async () => {
  const [rows] = await pool.query(`
    SELECT b.id, u.name as user_name, b.borrow_date, b.due_date, b.return_date
    FROM borrows b
    JOIN users u ON b.user_id = u.id
    ORDER BY b.borrow_date DESC
  `);
  return rows;
};

const getBorrowById = async (id) => {
  const [rows] = await pool.query(
    `SELECT b.id, u.name as user_name, b.borrow_date, b.due_date, b.return_date
       FROM borrows b
       JOIN users u ON b.user_id = u.id
       WHERE b.id = ?`,
    [id]
  );
  return rows[0] || null;
};

// ============ UPDATE ============
// Cập nhật thông tin phiếu mượn (ví dụ hạn trả)
const updateBorrow = async (id, data) => {
  const { due_date, return_date } = data;
  await pool.query(
    `UPDATE borrows SET due_date = ?, return_date = ? WHERE id = ?`,
    [due_date, return_date, id]
  );
  return getBorrowById(id);
};

// ============ DELETE ============
// Xoá phiếu mượn (cả chi tiết)
const deleteBorrow = async (id) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Xoá chi tiết
    await conn.query(`DELETE FROM borrow_details WHERE borrow_id = ?`, [id]);

    // Xoá phiếu
    await conn.query(`DELETE FROM borrows WHERE id = ?`, [id]);

    await conn.commit();
    return { message: `Borrow ${id} deleted` };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

module.exports = {
  createBorrow,
  getBorrows,
  getBorrowById,
  updateBorrow,
  deleteBorrow,
  getBorrowedBooksByUser,
};
