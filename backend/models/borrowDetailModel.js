const pool = require("../config/db");

// ========== CREATE ==========
// Thêm 1 chi tiết mượn (một bản ghi trong phiếu mượn)
const addDetail = async (borrow_id, record_id, hold_id = null) => {
  const [result] = await pool.query(
    `INSERT INTO borrow_details (borrow_id, record_id, hold_id, status) 
     VALUES (?, ?, ?, 'borrowed')`,
    [borrow_id, record_id, hold_id]
  );
  return result;
};

// ========== READ ==========
// Lấy chi tiết theo borrow_id (tất cả sách trong 1 phiếu mượn)
const getDetailsByBorrowId = async (borrowId) => {
  const [rows] = await pool.query(
    `
    SELECT bd.id, bd.borrow_id, bd.record_id, r.barcode,
           d.name as document_name,
           GROUP_CONCAT(DISTINCT a.name SEPARATOR ', ') as authors,
           bd.hold_id, bd.status, bd.return_date
    FROM borrow_details bd
    JOIN records r ON bd.record_id = r.id
    JOIN documents d ON r.doc_id = d.id
    LEFT JOIN doc_authors da ON d.id = da.doc_id
    LEFT JOIN authors a ON da.author_id = a.id
    WHERE bd.borrow_id = ?
    GROUP BY bd.id
    `,
    [borrowId]
  );
  return rows;
};

// Lấy chi tiết theo borrow_detail_id
const getDetailById = async (id) => {
  const [rows] = await pool.query(
    `
    SELECT bd.id, bd.borrow_id, bd.record_id, r.barcode,
           d.name as document_name,
           GROUP_CONCAT(DISTINCT a.name SEPARATOR ', ') as authors,
           bd.hold_id, bd.status, bd.return_date
    FROM borrow_details bd
    JOIN records r ON bd.record_id = r.id
    JOIN documents d ON r.doc_id = d.id
    LEFT JOIN doc_authors da ON d.id = da.doc_id
    LEFT JOIN authors a ON da.author_id = a.id
    WHERE bd.id = ?
    GROUP BY bd.id
    `,
    [id]
  );
  return rows[0] || null;
};

// ========== UPDATE ==========
// Cập nhật trạng thái (vd: trả sách, quá hạn)
const updateDetailStatus = async (id, status, return_date = null) => {
  const [result] = await pool.query(
    `UPDATE borrow_details 
     SET status = ?, return_date = ? 
     WHERE id = ?`,
    [status, return_date, id]
  );
  return result.affectedRows > 0;
};

// ========== DELETE ==========
// Xóa chi tiết mượn
const deleteDetail = async (id) => {
  const [result] = await pool.query(`DELETE FROM borrow_details WHERE id = ?`, [
    id,
  ]);
  return result.affectedRows > 0;
};

module.exports = {
  addDetail,
  getDetailsByBorrowId,
  getDetailById,
  updateDetailStatus,
  deleteDetail,
};
