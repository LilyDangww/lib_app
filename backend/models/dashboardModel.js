const pool = require("../config/db");

module.exports = {
  // ============================
  // ĐỘC GIẢ
  // ============================
  getReaderStats: async () => {
    const [rows] = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) AS total_readers,
        (SELECT COUNT(*) FROM users WHERE is_active = 1) AS active_readers
    `);
    return rows[0];
  },

  // ============================
  // PHIẾU MƯỢN
  // ============================
  getBorrowStats: async () => {
    const [rows] = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM borrow_tickets) AS total_borrows,
        (SELECT COUNT(*) FROM borrow_tickets WHERE status = 'active') AS active_borrows
    `);
    return rows[0];
  },

  // ============================
  // TÀI LIỆU ĐANG ĐƯỢC MƯỢN (status in borrow_details)
  // ============================
  getBorrowedDocumentStats: async () => {
    const [rows] = await pool.query(`
      SELECT COUNT(*) AS total_onloan
      FROM borrow_details
      WHERE status IN ('on_loan', 'expired')
    `);
    return rows[0];
  },

  // ============================
  // TIỀN PHẠT (SUM fines_detail.amount)
  // ============================
  getPenaltyStats: async () => {
    const [rows] = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM fine_tickets) AS total_penalties,
        (SELECT SUM(amount) FROM fines_detail) AS total_amount
    `);
    return rows[0];
  },

  // ============================
  // TOP 5 SÁCH MƯỢN NHIỀU NHẤT
  // ============================
  getTopBooks: async () => {
    const [rows] = await pool.query(`
      SELECT d.name AS book_name, COUNT(*) AS borrow_count
      FROM borrow_details bd
      JOIN records r ON bd.record_id = r.id
      JOIN documents d ON r.doc_id = d.id
      GROUP BY r.doc_id
      ORDER BY borrow_count DESC
      LIMIT 5;
    `);
    return rows;
  },

  // ============================
  // TOP 3 NGƯỜI MƯỢN NHIỀU NHẤT
  // ============================
  getTopUsers: async () => {
    const [rows] = await pool.query(`
      SELECT u.fullname, COUNT(*) AS borrow_total
      FROM borrow_tickets bt
      JOIN users u ON bt.user_id = u.id
      GROUP BY bt.user_id
      ORDER BY borrow_total DESC
      LIMIT 3;
    `);
    return rows;
  },
};
