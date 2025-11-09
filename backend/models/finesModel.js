const pool = require("../config/db");

const Fines = {
  async calculateOverdueAmount(loan_item_id) {
    const [[row]] = await pool.query(
      `
      SELECT
        bd.id AS loan_item_id,
        GREATEST(DATEDIFF(COALESCE(bd.return_date, CURDATE()), bt.due_date), 0) AS days_late
      FROM borrow_details bd
      JOIN borrow_tickets bt ON bd.borrow_id = bt.id
      WHERE bd.id = ?
      `,
      [loan_item_id]
    );

    if (!row || row.days_late === 0) return { amount: 0, days_late: 0 };

    const [[rule]] = await pool.query(
      `
      SELECT *
      FROM overdue_rules
      WHERE is_active = 1
      AND ? >= days_min
      AND (days_max IS NULL OR ? <= days_max)
      ORDER BY days_min DESC
      LIMIT 1
      `,
      [row.days_late, row.days_late]
    );

    const amount =
      rule.mode === "per_day"
        ? rule.per_day_amount * row.days_late
        : rule.flat_amount;

    return { amount, days_late: row.days_late, rule };
  },

  // 🔥 Tạo phiếu phạt từ loan_item_id
  async createFineFromLoanItem(loan_item_id, reason) {
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      // Lấy thông tin loan item + user + sách
      const [[item]] = await conn.query(
        `
        SELECT bd.id AS loan_item_id, bt.user_id, bd.record_id,
               d.name AS book_title, r.barcode
        FROM borrow_details bd
        JOIN borrow_tickets bt ON bd.borrow_id = bt.id
        JOIN records r ON bd.record_id = r.id
        JOIN documents d ON r.doc_id = d.id
        WHERE bd.id = ?
        `,
        [loan_item_id]
      );

      if (!item) throw new Error("Loan item not found");

      // 1️⃣ tạo phiếu phạt
      const [fineHeader] = await conn.query(
        `INSERT INTO fine_tickets (user_id, issued_date, status)
         VALUES (?, NOW(), 'unpaid')`,
        [item.user_id]
      );

      const fine_id = fineHeader.insertId;

      let amount = 0;
      let meta = {};
      let reason_id = null;

      // 2️⃣ nếu quá hạn → tính tiền
      if (reason === "overdue") {
        const overdue = await this.calculateOverdueAmount(loan_item_id);
        amount = overdue.amount;
        meta = { days_late: overdue.days_late, rule: overdue.rule.id };
        reason_id = 1; // ví dụ reason_id = 1 = quá hạn
      }

      // 3️⃣ nếu mất sách → lấy phí thay thế
      else if (reason === "lost") {
        const [[lostRule]] = await conn.query(
          `SELECT replacement_cost FROM records WHERE id = ?`,
          [item.record_id]
        );

        amount = lostRule?.replacement_cost || 0;
        meta = { lost: true };
        reason_id = 2; // 2 = mất sách
      }

      // 4️⃣ tạo chi tiết phạt
      await conn.query(
        `
        INSERT INTO fines_detail (fine_id, loan_item_id, reason_id, amount, meta)
        VALUES (?, ?, ?, ?, ?)
        `,
        [fine_id, loan_item_id, reason_id, amount, JSON.stringify(meta)]
      );

      await conn.commit();
      return fine_id;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  async getFine(fine_id) {
    const [[fine]] = await pool.query(
      `
      SELECT f.*, u.username, u.phone
      FROM fine_tickets f
      JOIN users u ON f.user_id = u.id
      WHERE f.id = ?
      `,
      [fine_id]
    );

    const [details] = await pool.query(
      `
      SELECT fd.*, d.name AS book_title, r.barcode
      FROM fines_detail fd
      JOIN borrow_details bd ON fd.loan_item_id = bd.id
      JOIN records r ON bd.record_id = r.id
      JOIN documents d ON r.doc_id = d.id
      WHERE fine_id = ?
      `,
      [fine_id]
    );

    fine.details = details;
    fine.total_amount = details.reduce((sum, i) => sum + Number(i.amount), 0);

    return fine;
  },
};

module.exports = Fines;
