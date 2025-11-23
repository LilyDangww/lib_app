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
          due_date,
          status
        )
        VALUES (?, ?, ?, ?, 'on_loan')
      `,
        [borrowId, recordId, reservationDetailId || null, due_date]
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
const getBorrows = async (fromDate, toDate, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  
  // Count total records
  let countQuery = `
    SELECT COUNT(*) as total
    FROM borrow_tickets b
    JOIN users u ON b.user_id = u.id
    WHERE 1=1
  `;
  const countParams = [];
  if (fromDate) {
    countQuery += ` AND b.borrow_date >= ?`;
    countParams.push(fromDate);
  }
  if (toDate) {
    countQuery += ` AND b.borrow_date <= ?`;
    countParams.push(toDate);
  }
  
  const [countResult] = await pool.query(countQuery, countParams);
  const total = countResult[0].total;
  const totalPages = Math.ceil(total / limit);

  // Get paginated data
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
  query += ` ORDER BY b.borrow_date DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const [rows] = await pool.query(query, params);
  return { page, limit, total, totalPages, data: rows };
};

// Lấy chi tiết phiếu mượn (reader hoặc librarian)
const getBorrowById = async (id) => {
  // Get ticket info with user
  const [[ticketInfo]] = await pool.query(
    `
    SELECT b.id as borrow_id,
           b.user_id,
           u.username as user_name,
           b.borrow_date,
           b.due_date,
           b.status as ticket_status
    FROM borrow_tickets b
    JOIN users u ON b.user_id = u.id
    WHERE b.id = ?
    `,
    [id]
  );

  if (!ticketInfo) {
    return null;
  }

  // Get borrow details (books)
  const [details] = await pool.query(
    `
    SELECT bd.id as borrow_detail_id,
           bd.record_id,
           r.barcode as record_barcode,
           bd.status as detail_status,
           bd.return_date,
           d.id as document_id,
           d.name as document_name,
           d.image_url AS document_image_url,
           CASE WHEN bd.reservation_detail_id IS NOT NULL THEN 'Mượn online' ELSE 'Mượn tại chỗ' END as borrow_type
    FROM borrow_details bd
    JOIN records r ON bd.record_id = r.id
    JOIN documents d ON r.doc_id = d.id
    WHERE bd.borrow_id = ?
    ORDER BY bd.id
    `,
    [id]
  );

  return {
    ticket: ticketInfo,
    details: details || [],
  };
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
      d.image_url AS document_image_url,   
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

// Auto expire borrow details overdue 35 days (via due_date) and sync ticket status
const autoUpdateOverdue = async () => {
  // 1) Mark details expired
  const [res] = await pool.query(`
    UPDATE borrow_details bd
    JOIN borrow_tickets b ON bd.borrow_id = b.id
    SET bd.status = 'expired'
    WHERE bd.status = 'on_loan' AND b.due_date < CURDATE()
  `);

  // 2) Re-check affected tickets and close when appropriate
  const [ids] = await pool.query(`
    SELECT DISTINCT bd.borrow_id
    FROM borrow_details bd
    JOIN borrow_tickets b ON bd.borrow_id = b.id
    WHERE b.due_date < CURDATE()
  `);

  for (const row of ids) {
    await updateBorrowTicketStatus(row.borrow_id);
  }

  return {
    expired_details: res.affectedRows || 0,
    affected_tickets: ids.length || 0,
  };
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

// ============ SUMMARY ============
// Lấy tóm tắt thống kê mượn theo user
const getBorrowSummary = async (page, limit) => {
  const offset = (page - 1) * limit;

  // Đếm tổng số user có phiếu mượn
  const [countResult] = await pool.query(
    `
    SELECT COUNT(DISTINCT u.id) as total
    FROM users u
    INNER JOIN borrow_tickets b ON u.id = b.user_id
    `
  );
  const total = countResult[0].total;
  const totalPages = Math.ceil(total / limit);

  // Lấy dữ liệu với pagination
  const [rows] = await pool.query(
    `
    SELECT 
      u.id as user_id,
      u.username as user_name,
      COUNT(DISTINCT b.id) AS total_tickets,
      COUNT(DISTINCT CASE WHEN b.status = 'active' THEN b.id END) AS active_tickets,
      COUNT(DISTINCT CASE WHEN b.status = 'closed' THEN b.id END) AS closed_tickets,
      COUNT(DISTINCT bd.id) AS total_borrowed_books,
      COUNT(DISTINCT CASE WHEN bd.status = 'on_loan' THEN bd.id END) AS on_loan_count,
      COUNT(DISTINCT CASE WHEN bd.status = 'returned' THEN bd.id END) AS returned_count,
      COUNT(DISTINCT CASE WHEN bd.status = 'expired' THEN bd.id END) AS expired_count,
      COUNT(DISTINCT CASE WHEN bd.status = 'lost' THEN bd.id END) AS lost_count,
      COUNT(DISTINCT CASE WHEN b.due_date < CURDATE() AND bd.status = 'on_loan' THEN bd.id END) AS overdue_count
    FROM users u
    INNER JOIN borrow_tickets b ON u.id = b.user_id
    LEFT JOIN borrow_details bd ON b.id = bd.borrow_id
    GROUP BY u.id, u.username
    ORDER BY u.id ASC, u.username ASC
    LIMIT ? OFFSET ?
    `,
    [limit, offset]
  );

  return {
    page,
    limit,
    total,
    totalPages,
    data: rows.map((row) => ({
      user_id: Number(row.user_id),
      user_name: row.user_name,
      total_tickets: Number(row.total_tickets || 0),
      active_tickets: Number(row.active_tickets || 0),
      closed_tickets: Number(row.closed_tickets || 0),
      total_borrowed_books: Number(row.total_borrowed_books || 0),
      on_loan_count: Number(row.on_loan_count || 0),
      returned_count: Number(row.returned_count || 0),
      expired_count: Number(row.expired_count || 0),
      lost_count: Number(row.lost_count || 0),
      overdue_count: Number(row.overdue_count || 0),
    })),
  };
};

// Lấy tóm tắt thống kê mượn theo sách
const getBorrowSummaryByBook = async (page, limit) => {
  const offset = (page - 1) * limit;

  // Đếm tổng số sách có được mượn
  const [countResult] = await pool.query(
    `
    SELECT COUNT(DISTINCT d.id) as total
    FROM documents d
    INNER JOIN records r ON d.id = r.doc_id
    INNER JOIN borrow_details bd ON r.id = bd.record_id
    WHERE d.is_active = 1
    `
  );
  const total = countResult[0].total;
  const totalPages = Math.ceil(total / limit);

  // Lấy dữ liệu với pagination
  const [rows] = await pool.query(
    `
    SELECT 
      d.id as book_id,
      d.name as book_name,
      d.category_id,
      c.category_name AS category,
      COUNT(DISTINCT bd.id) AS total_borrowed_times,
      COUNT(DISTINCT CASE WHEN bd.status = 'on_loan' THEN bd.id END) AS on_loan_count,
      COUNT(DISTINCT CASE WHEN bd.status = 'returned' THEN bd.id END) AS returned_count,
      COUNT(DISTINCT CASE WHEN bd.status = 'expired' THEN bd.id END) AS expired_count,
      COUNT(DISTINCT CASE WHEN bd.status = 'lost' THEN bd.id END) AS lost_count,
      COUNT(DISTINCT CASE WHEN b.due_date < CURDATE() AND bd.status = 'on_loan' THEN bd.id END) AS overdue_count,
      COUNT(DISTINCT bd.borrow_id) AS total_borrow_tickets,
      COUNT(DISTINCT CASE WHEN b.status = 'active' THEN b.id END) AS active_tickets
    FROM documents d
    INNER JOIN records r ON d.id = r.doc_id
    INNER JOIN borrow_details bd ON r.id = bd.record_id
    INNER JOIN borrow_tickets b ON bd.borrow_id = b.id
    LEFT JOIN categories c ON d.category_id = c.id
    WHERE d.is_active = 1
    GROUP BY d.id, d.name, d.category_id, c.category_name
    ORDER BY d.id ASC, d.name ASC
    LIMIT ? OFFSET ?
    `,
    [limit, offset]
  );

  return {
    page,
    limit,
    total,
    totalPages,
    data: rows.map((row) => ({
      book_id: Number(row.book_id),
      book_name: row.book_name,
      category_id: row.category_id ? Number(row.category_id) : null,
      category: row.category || null,
      total_borrowed_times: Number(row.total_borrowed_times || 0),
      on_loan_count: Number(row.on_loan_count || 0),
      returned_count: Number(row.returned_count || 0),
      expired_count: Number(row.expired_count || 0),
      lost_count: Number(row.lost_count || 0),
      overdue_count: Number(row.overdue_count || 0),
      total_borrow_tickets: Number(row.total_borrow_tickets || 0),
      active_tickets: Number(row.active_tickets || 0),
    })),
  };
};

module.exports = {
  createBorrow,
  getBorrows,
  getBorrowById,
  updateBorrowStatus,
  autoUpdateOverdue, // updated logic
  closeBorrow,
  updateBorrowTicketStatus,
  returnBook,
  getBorrowsByUser,
  getBorrowSummary,
  getBorrowSummaryByBook,
};
