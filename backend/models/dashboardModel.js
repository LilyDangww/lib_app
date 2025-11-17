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
    // Số sách đang mượn (gồm cả quá hạn -> expired). Nếu chỉ muốn on_loan, bỏ 'expired'
    const [rows] = await pool.query(`
      SELECT COUNT(*) AS total_onloan
      FROM borrow_details
      WHERE status IN ('on_loan', 'expired')
    `);
    return rows[0];
  },

  // Thêm: số phiếu mượn đang hoạt động (có ít nhất 1 chi tiết đang mượn/expired)
  getActiveBorrowTicketCount: async () => {
    const [rows] = await pool.query(`
      SELECT COUNT(DISTINCT borrow_id) AS active_tickets
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
  // TRẠNG THÁI BẢN GHI TÀI LIỆU (pie chart)
  // ============================
  getDocumentStatusStats: async () => {
    const [rows] = await pool.query(`
      SELECT
        SUM(CASE WHEN status = 'reserved_pending' THEN 1 ELSE 0 END) AS reserved_pending,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END)        AS available,
        SUM(CASE WHEN status = 'on_hold' THEN 1 ELSE 0 END)          AS on_hold,
        SUM(CASE WHEN status = 'on_loan' THEN 1 ELSE 0 END)          AS on_loan,
        SUM(CASE WHEN status = 'lost' THEN 1 ELSE 0 END)             AS lost
      FROM records
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
      SELECT u.username, COUNT(*) AS borrow_total
      FROM borrow_tickets bt
      JOIN users u ON bt.user_id = u.id
      GROUP BY bt.user_id
      ORDER BY borrow_total DESC
      LIMIT 3;
    `);
    return rows;
  },

  // ============================
  // LƯỢT MƯỢN / TRẢ THEO THỜI GIAN (ví dụ 7 ngày gần nhất)
  // ============================
  getBorrowReturnChart: async () => {
    const [rows] = await pool.query(`
      SELECT 
        DATE(bt.borrow_date) AS date,
        COUNT(*) AS borrow_count,
        SUM(CASE WHEN bt.return_date IS NOT NULL THEN 1 ELSE 0 END) AS return_count
      FROM borrow_tickets bt
      WHERE bt.borrow_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(bt.borrow_date)
      ORDER BY date ASC
    `);
    return rows; // [{ date, borrow_count, return_count }, ...]
  },

  // ============================
  // LƯỢT MƯỢN / TRẢ THEO THỜI GIAN (theo SÁCH, trong khoảng ngày chọn)
  // ============================
  // fromDate, toDate dạng 'YYYY-MM-DD'. Nếu không truyền => mặc định 7 ngày gần nhất.
  getBorrowReturnChart: async (fromDate, toDate) => {
    // Nếu không truyền range -> dùng 7 ngày gần nhất
    let whereBorrow = "";
    let whereReturn = "";
    const params = [];

    if (fromDate && toDate) {
      // Mượn: theo borrow_tickets.borrow_date
      whereBorrow = "WHERE bt.borrow_date BETWEEN ? AND ?";
      params.push(fromDate, toDate);

      // Trả: theo borrow_details.updated_at (hoặc trả_date nếu bạn có cột riêng)
      whereReturn =
        "WHERE bd.status = 'returned' AND DATE(bd.updated_at) BETWEEN ? AND ?";
      params.push(fromDate, toDate);
    } else {
      // Mặc định: 7 ngày gần nhất
      whereBorrow =
        "WHERE bt.borrow_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
      whereReturn =
        "WHERE bd.status = 'returned' AND bd.updated_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
    }

    const [rows] = await pool.query(
      `
      /* Bảng ngày mượn theo sách */
      WITH borrow_days AS (
        SELECT 
          DATE(bt.borrow_date) AS date,
          COUNT(bd.id) AS borrow_count
        FROM borrow_tickets bt
        JOIN borrow_details bd ON bt.id = bd.borrow_id
        ${whereBorrow}
        GROUP BY DATE(bt.borrow_date)
      ),
      /* Bảng ngày trả theo sách (status = returned) */
      return_days AS (
        SELECT 
          DATE(bd.updated_at) AS date,
          COUNT(bd.id) AS return_count
        FROM borrow_details bd
        ${whereReturn}
        GROUP BY DATE(bd.updated_at)
      )
      SELECT 
        d.date,
        IFNULL(b.borrow_count, 0) AS borrow_count,
        IFNULL(r.return_count, 0) AS return_count
      FROM (
        SELECT date FROM borrow_days
        UNION
        SELECT date FROM return_days
      ) d
      LEFT JOIN borrow_days b ON d.date = b.date
      LEFT JOIN return_days r ON d.date = r.date
      ORDER BY d.date ASC
      `,
      params
    );

    return rows; // [{ date, borrow_count, return_count }, ...]
  },
};
