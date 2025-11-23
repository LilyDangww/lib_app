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
  async createFineFromLoanItem(loan_item_id, reason, providedAmount = null, providedOverdueDays = null) {
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
        // Use provided values if available, otherwise calculate
        if (providedAmount !== null && providedAmount !== undefined && providedOverdueDays !== null && providedOverdueDays !== undefined) {
          amount = providedAmount;
          const overdueDays = providedOverdueDays;
          
          // Try to get the rule that matches the overdue days
          const [[rule]] = await conn.query(
            `
            SELECT *
            FROM overdue_rules
            WHERE is_active = 1
            AND ? >= days_min
            AND (days_max IS NULL OR ? <= days_max)
            ORDER BY days_min DESC
            LIMIT 1
            `,
            [overdueDays, overdueDays]
          );
          
          if (rule) {
            meta = { days_late: overdueDays, rule: rule.id };
          } else {
            meta = { days_late: overdueDays };
          }
        } else {
          // Fall back to calculation if values not provided
          const overdue = await this.calculateOverdueAmount(loan_item_id);
          amount = overdue.amount;
          meta = { days_late: overdue.days_late, rule: overdue.rule.id };
        }
        reason_id = 1; // ví dụ reason_id = 1 = quá hạn
      }

      // 3️⃣ nếu mất sách → lấy phí thay thế (nếu có trong database, nếu không thì dùng giá trị mặc định)
      else if (reason === "lost") {
        // Thử lấy replacement_cost nếu column tồn tại
        try {
          const [[lostRule]] = await conn.query(
            `SELECT replacement_cost FROM records WHERE id = ?`,
            [item.record_id]
          );
          amount = lostRule?.replacement_cost || 0;
        } catch (err) {
          // Nếu column không tồn tại, dùng giá trị mặc định 0
          amount = 0;
        }
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

  // 🔥 Tạo phiếu phạt từ nhiều loan_item_id (multiple books)
  async createFineFromMultipleLoanItems(loanItems, reason) {
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      if (!loanItems || loanItems.length === 0) {
        throw new Error("Loan items array is required");
      }

      // Get user_id from first loan item
      const [[firstItem]] = await conn.query(
        `
        SELECT bd.id AS loan_item_id, bt.user_id
        FROM borrow_details bd
        JOIN borrow_tickets bt ON bd.borrow_id = bt.id
        WHERE bd.id = ?
        `,
        [loanItems[0].loan_item_id]
      );

      if (!firstItem) throw new Error("First loan item not found");
      const user_id = firstItem.user_id;

      // Verify all loan items belong to the same user
      const loanItemIds = loanItems.map((item) => item.loan_item_id);
      const [allItems] = await conn.query(
        `
        SELECT bd.id AS loan_item_id, bt.user_id
        FROM borrow_details bd
        JOIN borrow_tickets bt ON bd.borrow_id = bt.id
        WHERE bd.id IN (${loanItemIds.map(() => "?").join(",")})
        `,
        loanItemIds
      );

      const differentUserItems = allItems.filter((item) => item.user_id !== user_id);
      if (differentUserItems.length > 0) {
        throw new Error("All loan items must belong to the same user");
      }

      // 1️⃣ Create fine ticket
      const [fineHeader] = await conn.query(
        `INSERT INTO fine_tickets (user_id, issued_date, status)
         VALUES (?, NOW(), 'unpaid')`,
        [user_id]
      );

      const fine_id = fineHeader.insertId;
      const reason_id = reason === "overdue" ? 1 : reason === "lost" ? 2 : 3;

      // 2️⃣ Create fine details for each loan item
      for (const item of loanItems) {
        const { loan_item_id, amount, overdue_days } = item;

        // Get loan item info
        const [[loanItem]] = await conn.query(
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

        if (!loanItem) {
          throw new Error(`Loan item ${loan_item_id} not found`);
        }

        // Build meta based on reason
        let meta = {};
        if (reason === "overdue" && overdue_days !== null && overdue_days !== undefined) {
          // Try to get the rule that matches the overdue days
          const [[rule]] = await conn.query(
            `
            SELECT *
            FROM overdue_rules
            WHERE is_active = 1
            AND ? >= days_min
            AND (days_max IS NULL OR ? <= days_max)
            ORDER BY days_min DESC
            LIMIT 1
            `,
            [overdue_days, overdue_days]
          );

          if (rule) {
            meta = { days_late: overdue_days, rule: rule.id };
          } else {
            meta = { days_late: overdue_days };
          }
        } else if (reason === "lost") {
          meta = { lost: true };
        }

        // Insert fine detail
        await conn.query(
          `
          INSERT INTO fines_detail (fine_id, loan_item_id, reason_id, amount, meta)
          VALUES (?, ?, ?, ?, ?)
          `,
          [fine_id, loan_item_id, reason_id, amount || 0, JSON.stringify(meta)]
        );
      }

      await conn.commit();
      return fine_id;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  // 🔥 Tạo phiếu phạt trực tiếp với user_id, record_id, reason, amount
  async createFineDirect(user_id, record_id, reason, amount, overdueDays = null) {
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      // Kiểm tra user và record tồn tại
      const [[user]] = await conn.query(`SELECT id FROM users WHERE id = ?`, [user_id]);
      if (!user) throw new Error("User not found");

      const [[record]] = await conn.query(
        `SELECT r.id, r.doc_id, d.name AS book_title, r.barcode
         FROM records r
         JOIN documents d ON r.doc_id = d.id
         WHERE r.id = ?`,
        [record_id]
      );
      if (!record) throw new Error("Record not found");

      // Xác định reason_id
      let reason_id = null;
      let meta = {};

      if (reason === "overdue") {
        reason_id = 1; // 1 = quá hạn
        if (overdueDays !== null && overdueDays > 0) {
          // Tính tiền theo overdue_rules nếu có
          const [[rule]] = await conn.query(
            `
            SELECT *
            FROM overdue_rules
            WHERE is_active = 1
            AND ? >= days_min
            AND (days_max IS NULL OR ? <= days_max)
            ORDER BY days_min DESC
            LIMIT 1
            `,
            [overdueDays, overdueDays]
          );

          if (rule) {
            const calculatedAmount =
              rule.mode === "per_day"
                ? rule.per_day_amount * overdueDays
                : rule.flat_amount;
            amount = calculatedAmount;
            meta = { days_late: overdueDays, rule: rule.id };
          } else {
            meta = { days_late: overdueDays };
          }
        } else {
          meta = { days_late: overdueDays || 0 };
        }
      } else if (reason === "lost") {
        reason_id = 2; // 2 = mất sách
        // Nếu không có amount, để mặc định là 0 (người dùng phải nhập)
        if (!amount || amount === 0) {
          amount = 0;
        }
        meta = { lost: true };
      } else {
        // Custom reason
        reason_id = 3; // 3 = lý do khác
        meta = { custom_reason: reason };
      }

      // 1️⃣ Tạo phiếu phạt
      const [fineHeader] = await conn.query(
        `INSERT INTO fine_tickets (user_id, issued_date, status)
         VALUES (?, NOW(), 'unpaid')`,
        [user_id]
      );

      const fine_id = fineHeader.insertId;

      // Lưu record_id vào meta để có thể truy vết sau này
      meta.record_id = record_id;

      // 2️⃣ Tìm hoặc tạo loan_item_id
      // Vì loan_item_id không thể NULL, ta cần tìm borrow_detail hiện có hoặc tạo một entry tạm
      let loan_item_id = null;

      // Thử tìm borrow_detail hiện có cho user và record này
      const [existingBorrowDetails] = await conn.query(
        `
        SELECT bd.id
        FROM borrow_details bd
        JOIN borrow_tickets bt ON bd.borrow_id = bt.id
        WHERE bt.user_id = ? AND bd.record_id = ?
        ORDER BY bd.id DESC
        LIMIT 1
        `,
        [user_id, record_id]
      );

      if (existingBorrowDetails && existingBorrowDetails.length > 0) {
        loan_item_id = existingBorrowDetails[0].id;
      } else {
        // Nếu không tìm thấy, tạo một borrow_detail tạm chỉ để có loan_item_id
        // Tạo borrow_ticket tạm trước - sử dụng MySQL date functions trực tiếp
        const [tempBorrowTicket] = await conn.query(
          `INSERT INTO borrow_tickets (user_id, borrow_date, due_date, status)
           VALUES (?, NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY), 'closed')`,
          [user_id]
        );
        const tempBorrowId = tempBorrowTicket.insertId;

        // Tạo borrow_detail tạm
        const [tempBorrowDetail] = await conn.query(
          `INSERT INTO borrow_details (borrow_id, record_id, status, return_date)
           VALUES (?, ?, 'returned', NOW())`,
          [tempBorrowId, record_id]
        );
        loan_item_id = tempBorrowDetail.insertId;
        meta.temp_borrow_detail = true; // Đánh dấu đây là borrow_detail tạm
      }

      // 3️⃣ Tạo chi tiết phạt
      // Thử insert với record_id nếu column tồn tại, nếu không thì chỉ dùng meta
      try {
        await conn.query(
          `
          INSERT INTO fines_detail (fine_id, loan_item_id, reason_id, amount, meta, record_id)
          VALUES (?, ?, ?, ?, ?, ?)
          `,
          [fine_id, loan_item_id, reason_id, amount, JSON.stringify(meta), record_id]
        );
      } catch (err) {
        // Nếu record_id column không tồn tại, insert không có record_id
        if (err.message.includes("Unknown column 'record_id'")) {
          await conn.query(
            `
            INSERT INTO fines_detail (fine_id, loan_item_id, reason_id, amount, meta)
            VALUES (?, ?, ?, ?, ?)
            `,
            [fine_id, loan_item_id, reason_id, amount, JSON.stringify(meta)]
          );
        } else {
          throw err;
        }
      }

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

    if (!fine) return null;

    // Lấy chi tiết phạt - hỗ trợ cả loan_item_id và record_id từ meta
    // Note: fines_detail table doesn't have record_id column, so we only use JSON_EXTRACT from meta
    const [details] = await pool.query(
      `
      SELECT 
        fd.*,
        COALESCE(d.name, d2.name) AS book_title,
        COALESCE(r.barcode, r2.barcode) AS barcode
      FROM fines_detail fd
      LEFT JOIN borrow_details bd ON fd.loan_item_id = bd.id
      LEFT JOIN records r ON bd.record_id = r.id
      LEFT JOIN documents d ON r.doc_id = d.id
      LEFT JOIN records r2 ON JSON_EXTRACT(fd.meta, '$.record_id') = r2.id
      LEFT JOIN documents d2 ON r2.doc_id = d2.id
      WHERE fd.fine_id = ?
      `,
      [fine_id]
    );

    fine.details = details;
    fine.total_amount = details.reduce((sum, i) => sum + Number(i.amount), 0);

    return fine;
  },

  // Lấy danh sách phiếu phạt với pagination
  async getFines(page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    // Count total records
    const [countResult] = await pool.query(
      `SELECT COUNT(DISTINCT f.id) as total FROM fine_tickets f`
    );
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    // Get paginated data - get first detail from each fine for display
    const [rows] = await pool.query(
      `
      SELECT 
        f.id,
        f.user_id,
        u.username as user_name,
        f.issued_date,
        f.status,
        fd.id as detail_id,
        COALESCE(d.name, d2.name) AS book_name,
        COALESCE(r.barcode, r2.barcode) AS barcode,
        fd.amount,
        fd.reason_id,
        CASE 
          WHEN fd.reason_id = 1 THEN 'Quá hạn'
          WHEN fd.reason_id = 2 THEN 'Mất sách'
          ELSE 'Khác'
        END AS reason_label,
        JSON_EXTRACT(fd.meta, '$.days_late') AS overdue_days,
        (SELECT SUM(fd2.amount) FROM fines_detail fd2 WHERE fd2.fine_id = f.id) AS total_amount
      FROM fine_tickets f
      JOIN users u ON f.user_id = u.id
      LEFT JOIN fines_detail fd ON f.id = fd.fine_id 
        AND fd.id = (
          SELECT MIN(fd3.id) 
          FROM fines_detail fd3 
          WHERE fd3.fine_id = f.id
        )
      LEFT JOIN borrow_details bd ON fd.loan_item_id = bd.id
      LEFT JOIN records r ON bd.record_id = r.id
      LEFT JOIN documents d ON r.doc_id = d.id
      LEFT JOIN records r2 ON JSON_EXTRACT(fd.meta, '$.record_id') = r2.id
      LEFT JOIN documents d2 ON r2.doc_id = d2.id
      ORDER BY f.issued_date DESC
      LIMIT ? OFFSET ?
      `,
      [limit, offset]
    );

    // Map data to match frontend interface
    const data = rows.map((row) => ({
      id: row.id.toString(),
      userName: row.user_name || "",
      bookName: row.book_name || "",
      reason: row.reason_label || "Quá hạn",
      overdueDays: row.overdue_days ? parseInt(row.overdue_days) : null,
      amount: row.amount ? parseFloat(row.amount) : null,
      paymentStatus: row.status === "paid" ? "Đã thanh toán" : "Chưa thanh toán",
      creationDate: row.issued_date 
        ? new Date(row.issued_date).toLocaleDateString("vi-VN")
        : "",
      totalAmount: row.total_amount ? parseFloat(row.total_amount) : null,
    }));

    return { page, limit, total, totalPages, data };
  },

  // Cập nhật trạng thái phiếu phạt (paid/unpaid)
  async updateFineStatus(fine_id, status) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Kiểm tra phiếu phạt có tồn tại không
      const [[fine]] = await conn.query(
        `SELECT id, status FROM fine_tickets WHERE id = ?`,
        [fine_id]
      );

      if (!fine) {
        throw new Error("Fine ticket not found");
      }

      // Validate status
      if (!["paid", "unpaid"].includes(status)) {
        throw new Error("Invalid status. Must be 'paid' or 'unpaid'");
      }

      // Cập nhật trạng thái phiếu phạt
      await conn.query(
        `UPDATE fine_tickets SET status = ? WHERE id = ?`,
        [status, fine_id]
      );

      // Nếu đánh dấu là đã thanh toán, cập nhật trạng thái borrow_details và records
      if (status === "paid") {
        // Lấy tất cả loan_item_ids từ fine details
        const [fineDetails] = await conn.query(
          `SELECT loan_item_id FROM fines_detail WHERE fine_id = ?`,
          [fine_id]
        );

        if (fineDetails && fineDetails.length > 0) {
          const loanItemIds = fineDetails.map((fd) => fd.loan_item_id);

          // Lấy record_ids từ borrow_details
          const [borrowDetails] = await conn.query(
            `SELECT DISTINCT record_id FROM borrow_details WHERE id IN (${loanItemIds.map(() => "?").join(",")})`,
            loanItemIds
          );

          const recordIds = borrowDetails.map((bd) => bd.record_id).filter((id) => id !== null);

          // Cập nhật borrow_details: status = 'returned', return_date = NOW()
          if (loanItemIds.length > 0) {
            await conn.query(
              `UPDATE borrow_details 
               SET status = 'returned', return_date = NOW() 
               WHERE id IN (${loanItemIds.map(() => "?").join(",")})`,
              loanItemIds
            );
          }

          // Cập nhật records: status = 'available'
          if (recordIds.length > 0) {
            await conn.query(
              `UPDATE records SET status = 'available' WHERE id IN (${recordIds.map(() => "?").join(",")})`,
              recordIds
            );
          }
        }
      }

      await conn.commit();
      return true;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  // Xóa phiếu phạt
  async deleteFine(fine_id) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Kiểm tra phiếu phạt có tồn tại không
      const [[fine]] = await conn.query(
        `SELECT id FROM fine_tickets WHERE id = ?`,
        [fine_id]
      );

      if (!fine) {
        throw new Error("Fine ticket not found");
      }

      // Xóa chi tiết phạt trước (foreign key constraint)
      await conn.query(
        `DELETE FROM fines_detail WHERE fine_id = ?`,
        [fine_id]
      );

      // Xóa phiếu phạt
      await conn.query(
        `DELETE FROM fine_tickets WHERE id = ?`,
        [fine_id]
      );

      await conn.commit();
      return true;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },
};

module.exports = Fines;
