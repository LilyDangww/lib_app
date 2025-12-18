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
const getBorrows = async (
  fromDate,
  toDate,
  page = 1,
  limit = 10,
  status = null
) => {
  const offset = (page - 1) * limit;

  // Count total records
  let countQuery = `
    SELECT COUNT(DISTINCT b.id) as total
    FROM borrow_tickets b
    JOIN users u ON b.user_id = u.id
    LEFT JOIN borrow_details bd ON b.id = bd.borrow_id
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

  // Filter by status
  if (status === "active") {
    countQuery += ` AND b.status = 'active'`;
  } else if (status === "closed") {
    countQuery += ` AND b.status = 'closed'`;
  } else if (status === "expired") {
    // A borrow ticket is expired if it has at least one expired detail OR on_loan detail past due_date
    countQuery += ` AND EXISTS (
      SELECT 1 FROM borrow_details bd2 
      WHERE bd2.borrow_id = b.id 
      AND (bd2.status = 'expired' OR (bd2.status = 'on_loan' AND b.due_date < CURDATE()))
    )`;
  }

  const [countResult] = await pool.query(countQuery, countParams);
  const total = countResult[0].total;
  const totalPages = Math.ceil(total / limit);

  // Get paginated data with expiration check
  let query = `
    SELECT DISTINCT 
      b.id, 
      u.username as user_name, 
      b.borrow_date, 
      b.due_date, 
      b.status,
      CASE 
        WHEN EXISTS (
          SELECT 1 FROM borrow_details bd_check 
          WHERE bd_check.borrow_id = b.id 
          AND (bd_check.status = 'expired' OR (bd_check.status = 'on_loan' AND b.due_date < CURDATE()))
        ) THEN 1 
        ELSE 0 
      END as is_expired
    FROM borrow_tickets b
    JOIN users u ON b.user_id = u.id
    LEFT JOIN borrow_details bd ON b.id = bd.borrow_id
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

  // Filter by status
  if (status === "active") {
    query += ` AND b.status = 'active'`;
  } else if (status === "closed") {
    query += ` AND b.status = 'closed'`;
  } else if (status === "expired") {
    // A borrow ticket is expired if it has at least one expired detail OR on_loan detail past due_date
    query += ` AND EXISTS (
      SELECT 1 FROM borrow_details bd2 
      WHERE bd2.borrow_id = b.id 
      AND (bd2.status = 'expired' OR (bd2.status = 'on_loan' AND b.due_date < CURDATE()))
    )`;
  }

  query += ` ORDER BY b.borrow_date DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const [rows] = await pool.query(query, params);

  // Convert is_expired from 0/1 to boolean
  const data = rows.map((row) => ({
    ...row,
    is_expired: Boolean(row.is_expired),
  }));

  return { page, limit, total, totalPages, data };
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
const getBorrowsByUser = async (
  userId,
  fromDate,
  toDate,
  page = 1,
  limit = 10
) => {
  const offset = (page - 1) * limit;

  // Count total records
  let countSql = `
    SELECT COUNT(bd.id) as total
    FROM borrow_tickets b
    JOIN borrow_details bd ON bd.borrow_id = b.id
    JOIN records r ON r.id = bd.record_id
    JOIN documents d ON d.id = r.doc_id
    WHERE b.user_id = ?
  `;
  const countParams = [userId];

  if (fromDate) {
    countSql += ` AND b.borrow_date >= ?`;
    countParams.push(fromDate);
  }
  if (toDate) {
    countSql += ` AND b.borrow_date <= ?`;
    countParams.push(toDate);
  }

  const [countResult] = await pool.query(countSql, countParams);
  const total = countResult[0].total;
  const totalPages = Math.ceil(total / limit);

  // Get paginated data
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

  sql += ` ORDER BY b.borrow_date DESC, bd.id DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const [rows] = await pool.query(sql, params);

  return {
    page,
    limit,
    total,
    totalPages,
    data: rows,
  };
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
// Auto expire borrow details (overdue by due_date)
const autoUpdateOverdue = async () => {
  // 1) Đánh dấu chi tiết mượn quá hạn
  const [res] = await pool.query(`
    UPDATE borrow_details bd
    JOIN borrow_tickets bt ON bt.id = bd.borrow_id
    SET bd.status = 'expired'
    WHERE bd.status = 'on_loan'
      AND bt.due_date < CURDATE()
  `);

  // 2) Lấy các borrow_id bị ảnh hưởng
  const [affected] = await pool.query(`
    SELECT DISTINCT bd.borrow_id
    FROM borrow_details bd
    JOIN borrow_tickets bt ON bt.id = bd.borrow_id
    WHERE bt.due_date < CURDATE()
  `);

  // 3) Cập nhật phiếu mượn thành "overdue"
  await pool.query(
    `
    UPDATE borrow_tickets
    SET status = 'expired'
    WHERE id IN (?)
    `,
    [affected.map((x) => x.borrow_id)]
  );

  // 4) Đồng bộ lại phiếu mượn (KHÔNG override trạng thái overdue)
  for (const row of affected) {
    await updateBorrowTicketStatus(row.borrow_id);
  }

  return {
    expired_details: res.affectedRows || 0,
    affected_tickets: affected.length || 0,
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

    if (!rows || rows.length === 0) {
      await conn.commit();
      return;
    }

    const allClosed = rows.every(
      (d) => d.status === "returned" || d.status === "lost"
    );

    const hasExpired = rows.some((d) => d.status === "expired");
    const hasOnLoan = rows.some((d) => d.status === "on_loan");

    let nextStatus;

    if (allClosed) {
      nextStatus = "closed";
    } else if (hasExpired) {
      // có bất kỳ chi tiết quá hạn → phiếu quá hạn
      nextStatus = "expired";
    } else if (hasOnLoan) {
      // còn chi tiết đang mượn nhưng chưa quá hạn
      nextStatus = "active";
    } else {
      // fallback (phòng trường hợp có trạng thái khác)
      nextStatus = "active";
    }

    await conn.query(`UPDATE borrow_tickets SET status = ? WHERE id = ?`, [
      nextStatus,
      borrowId,
    ]);

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

// Đánh dấu sách là mất: cập nhật chi tiết mượn và bản ghi
const markBookAsLost = async (borrowDetailId) => {
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
    if (detail.status === "returned" || detail.status === "lost")
      throw new Error(
        "Không thể đánh dấu mất: chi tiết mượn đã được trả hoặc đã được đánh dấu mất"
      );

    // Cập nhật chi tiết mượn thành "lost"
    await conn.query(
      `UPDATE borrow_details
       SET status = 'lost', return_date = CURDATE()
       WHERE id = ?`,
      [borrowDetailId]
    );

    // Cập nhật bản ghi thành "lost"
    await conn.query(`UPDATE records SET status = 'lost' WHERE id = ?`, [
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

// Trả tất cả sách trong phiếu mượn: chỉ xử lý chi tiết và bản ghi, KHÔNG gọi updateBorrowTicketStatus tại model
const returnAllBooks = async (borrowId) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Kiểm tra phiếu mượn có tồn tại không
    const [[ticket]] = await conn.query(
      `SELECT id, status FROM borrow_tickets WHERE id = ?`,
      [borrowId]
    );
    if (!ticket) throw new Error("Phiếu mượn không tồn tại");

    // Lấy tất cả chi tiết mượn đang ở trạng thái on_loan hoặc expired
    const [details] = await conn.query(
      `SELECT bd.id, bd.borrow_id, bd.record_id, bd.status
       FROM borrow_details bd
       WHERE bd.borrow_id = ? AND bd.status IN ('on_loan', 'expired')`,
      [borrowId]
    );

    if (!details || details.length === 0) {
      throw new Error("Không có sách nào đang mượn trong phiếu này để trả");
    }

    const detailIds = details.map((d) => d.id);
    const recordIds = details.map((d) => d.record_id);

    // Cập nhật tất cả chi tiết mượn thành 'returned'
    await conn.query(
      `UPDATE borrow_details
       SET status = 'returned', return_date = CURDATE()
       WHERE id IN (${detailIds.map(() => "?").join(",")})`,
      detailIds
    );

    // Cập nhật tất cả bản ghi thành 'available'
    await conn.query(
      `UPDATE records SET status = 'available' WHERE id IN (${recordIds
        .map(() => "?")
        .join(",")})`,
      recordIds
    );

    await conn.commit();

    // Trả về borrow_id và danh sách các chi tiết đã trả
    return {
      borrowId: borrowId,
      returnedDetails: details.map((d) => ({
        detailId: d.id,
        recordId: d.record_id,
      })),
      totalReturned: details.length,
    };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

// Trả nhiều sách từ danh sách chi tiết mượn (borrow_detail_id)
const returnFromLoanItems = async (borrowDetailIds) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    if (!Array.isArray(borrowDetailIds) || borrowDetailIds.length === 0) {
      throw new Error("borrowDetailIds must be a non-empty array");
    }

    // Lấy thông tin chi tiết mượn để biết borrow_id + record_id
    const [details] = await conn.query(
      `
      SELECT bd.id, bd.borrow_id, bd.record_id, bd.status
      FROM borrow_details bd
      WHERE bd.id IN (${borrowDetailIds.map(() => "?").join(",")})
      `,
      borrowDetailIds
    );

    if (!details || details.length === 0) {
      throw new Error("Không tìm thấy chi tiết mượn nào");
    }

    // Lọc chỉ những chi tiết đang mượn / quá hạn
    const validDetails = details.filter((d) =>
      ["on_loan", "expired"].includes(d.status)
    );

    if (validDetails.length === 0) {
      throw new Error(
        "Không có chi tiết mượn nào ở trạng thái on_loan hoặc expired để trả"
      );
    }

    const validDetailIds = validDetails.map((d) => d.id);
    const recordIds = validDetails.map((d) => d.record_id);
    const borrowIds = [...new Set(validDetails.map((d) => d.borrow_id))]; // unique borrow_id

    // Cập nhật borrow_details -> returned
    await conn.query(
      `
      UPDATE borrow_details
      SET status = 'returned', return_date = CURDATE()
      WHERE id IN (${validDetailIds.map(() => "?").join(",")})
      `,
      validDetailIds
    );

    // Cập nhật records -> available
    await conn.query(
      `
      UPDATE records
      SET status = 'available'
      WHERE id IN (${recordIds.map(() => "?").join(",")})
      `,
      recordIds
    );

    await conn.commit();

    return {
      borrowIds,
      returnedDetails: validDetails.map((d) => ({
        detailId: d.id,
        borrowId: d.borrow_id,
        recordId: d.record_id,
      })),
      totalReturned: validDetails.length,
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
const getBorrowSummaryByBook = async ({
  page = 1,
  limit = 20,
  fromDate,
  toDate,
}) => {
  const offset = (page - 1) * limit;

  let where = "WHERE 1 = 1";
  const params = [];
  const countParams = [];

  if (fromDate) {
    where += " AND bt.borrow_date >= ?";
    params.push(fromDate);
    countParams.push(fromDate);
  }
  if (toDate) {
    where += " AND bt.borrow_date <= ?";
    params.push(toDate);
    countParams.push(toDate);
  }

  // 1) Đếm tổng số đầu sách trong thống kê
  const countSql = `
    SELECT COUNT(*) AS total
    FROM (
      SELECT d.id
      FROM borrow_tickets bt
      JOIN borrow_details bd ON bd.borrow_id = bt.id
      JOIN records r ON r.id = bd.record_id
      JOIN documents d ON d.id = r.doc_id
      LEFT JOIN categories c ON c.id = d.category_id
      ${where}
      GROUP BY d.id, d.name, c.id, c.category_name
    ) AS sub
  `;
  const [countRows] = await pool.query(countSql, countParams);
  const total = countRows[0]?.total || 0;
  const totalPages = Math.ceil(total / limit) || 1;

  // 2) Lấy dữ liệu phân trang
  const sql = `
    SELECT
      d.id AS book_id,
      d.name AS book_name,
      c.id AS category_id,
      c.category_name AS category,
      COUNT(*) AS total_borrowed_times,
      SUM(CASE WHEN bd.status = 'on_loan' THEN 1 ELSE 0 END) AS on_loan_count,
      SUM(CASE WHEN bd.status = 'returned' THEN 1 ELSE 0 END) AS returned_count,
      SUM(CASE WHEN bd.status = 'expired' THEN 1 ELSE 0 END) AS expired_count,
      SUM(CASE WHEN bd.status = 'lost' THEN 1 ELSE 0 END) AS lost_count,
      SUM(
        CASE
          WHEN bd.status IN ('on_loan', 'expired')
           AND bd.due_date < CURRENT_DATE
          THEN 1 ELSE 0
        END
      ) AS overdue_count,
      COUNT(DISTINCT bt.id) AS total_borrow_tickets,
      SUM(CASE WHEN bt.status = 'active' THEN 1 ELSE 0 END) AS active_tickets
    FROM borrow_tickets bt
    JOIN borrow_details bd ON bd.borrow_id = bt.id
    JOIN records r ON r.id = bd.record_id
    JOIN documents d ON d.id = r.doc_id
    LEFT JOIN categories c ON c.id = d.category_id
    ${where}
    GROUP BY d.id, d.name, c.id, c.category_name
    ORDER BY d.name ASC
    LIMIT ? OFFSET ?
  `;
  params.push(limit, offset);

  const [rows] = await pool.query(sql, params);

  return {
    page,
    limit,
    total,
    totalPages,
    data: rows,
  };
};

const getBorrowSummaryByUsers = async ({
  page = 1,
  limit = 20,
  fromDate,
  toDate,
  userId, // 👈 thêm
}) => {
  const offset = (page - 1) * limit;

  let where = "WHERE 1 = 1";
  const params = [];

  if (fromDate) {
    where += " AND bt.borrow_date >= ?";
    params.push(fromDate);
  }
  if (toDate) {
    where += " AND bt.borrow_date <= ?";
    params.push(toDate);
  }
  if (userId) {
    where += " AND bt.user_id = ?";
    params.push(userId);
  }

  const sql = `
    SELECT
      bt.user_id,
      u.username AS user_name,
      COUNT(DISTINCT bt.id) AS total_tickets,
      SUM(CASE WHEN bt.status = 'open' THEN 1 ELSE 0 END) AS active_tickets,
      SUM(CASE WHEN bt.status = 'closed' THEN 1 ELSE 0 END) AS closed_tickets,
      COUNT(bd.id) AS total_borrowed_books,
      SUM(CASE WHEN bd.status = 'on_loan' THEN 1 ELSE 0 END) AS on_loan_count,
      SUM(CASE WHEN bd.status = 'returned' THEN 1 ELSE 0 END) AS returned_count,
      SUM(CASE WHEN bd.status = 'expired' THEN 1 ELSE 0 END) AS expired_count,
      SUM(CASE WHEN bd.status = 'lost' THEN 1 ELSE 0 END) AS lost_count,
      SUM(
        CASE
          WHEN bd.status IN ('on_loan', 'expired')
           AND bd.due_date < CURRENT_DATE
          THEN 1 ELSE 0
        END
      ) AS overdue_count
    FROM borrow_tickets bt
    JOIN users u ON u.id = bt.user_id
    JOIN borrow_details bd ON bd.borrow_id = bt.id
    ${where}
    GROUP BY bt.user_id, u.username
    ORDER BY u.username ASC
    LIMIT ? OFFSET ?
  `;
  params.push(limit, offset);

  const [rows] = await pool.query(sql, params);

  // ...tính total, totalPages nếu bạn đã có ở đây, đừng quên dùng cùng where + userId...

  return {
    page,
    limit,
    total,
    totalPages,
    data: rows,
  };
};

/**
 * Báo cáo mượn theo người dùng (chi tiết từng sách)
 * @param {Object} params
 * @param {string|null} params.fromDate - YYYY-MM-DD
 * @param {string|null} params.toDate   - YYYY-MM-DD
 * @param {number|undefined} params.userId
 * @param {string|undefined} params.bookName
 */
const getBorrowReportByUsers = async ({
  fromDate,
  toDate,
  userId,
  bookName,
}) => {
  let sql = `
    SELECT
      u.id              AS user_id,
      u.username,
      u.email,
      bt.id             AS borrow_id,
      d.name            AS book_name,
      r.barcode,
      bt.borrow_date,
      bd.return_date,
      
      CASE
        WHEN bd.status = 'lost' THEN 'lost'
        WHEN bd.return_date IS NOT NULL THEN 'returned'
        WHEN bd.due_date < CURRENT_DATE AND bd.return_date IS NULL
          THEN 'overdue'
        ELSE 'borrowing'
      END AS status,

      CASE
        WHEN bd.due_date < CURRENT_DATE AND bd.return_date IS NULL
          THEN DATEDIFF(CURRENT_DATE, bd.due_date)
        ELSE 0
      END AS overdue_days

    FROM borrow_tickets bt
    JOIN users u ON bt.user_id = u.id
    JOIN borrow_details bd ON bt.id = bd.borrow_id
    JOIN records r ON bd.record_id = r.id
    JOIN documents d ON r.doc_id = d.id
    WHERE 1 = 1
  `;

  const params = [];

  if (fromDate) {
    sql += " AND bt.borrow_date >= ?";
    params.push(fromDate);
  }

  if (toDate) {
    sql += " AND bt.borrow_date <= ?";
    params.push(toDate);
  }

  if (userId) {
    sql += " AND bt.user_id = ?";
    params.push(userId);
  }

  // 👇 thêm lọc theo đầu sách (tên sách)
  if (bookName) {
    sql += " AND d.name LIKE ?";
    params.push(`%${bookName}%`);
  }

  sql += " ORDER BY u.username, bt.borrow_date DESC, bd.id";

  const [rows] = await pool.query(sql, params);
  return rows;
};

/**
 * Báo cáo chi tiết mượn quá hạn & mất + thông tin phạt
 *
 * - Nhóm 1: chi tiết mượn đang QUÁ HẠN CHƯA PHẠT
 *    bd.status = 'on_loan' AND bd.due_date < CURRENT_DATE
 *    (fd có thể null hoặc không, nhưng nếu null thì chắc chắn chưa phạt)
 *
 * - Nhóm 2: chi tiết mượn ĐÃ CÓ PHIẾU PHẠT (paid/unpaid)
 *    fd.id IS NOT NULL
 *
 * - overdue_days:
 *    + lost: 0
 *    + fd.id NOT NULL: DATEDIFF(DATE(ft.issued_date), bd.due_date)
 *    + fd.id IS NULL & on_loan & quá hạn: DATEDIFF(CURRENT_DATE, bd.due_date)
 */
const getOverdueLostReport = async () => {
  const [rows] = await pool.query(
    `
    SELECT
      u.id            AS user_id,
      u.username      AS username,
      bt.id           AS borrow_id,
      d.name          AS book_name,
      r.barcode       AS barcode,
      bt.borrow_date,
      bd.due_date,
      bd.return_date,

      -- Lý do (cho FE nếu cần)
      CASE
        WHEN bd.status = 'lost' THEN 'lost'
        WHEN bd.status = 'on_loan' AND bd.due_date < CURRENT_DATE THEN 'overdue'
        ELSE 'other'
      END AS reason,

      -- Số ngày quá hạn:
      --  lost: 0
      --  đã phạt: ngày lập phiếu - hạn
      --  chưa phạt & đang mượn/đã expired & quá hạn: hôm nay - hạn
      CASE
        WHEN bd.status = 'lost' THEN 0

        -- ĐÃ CÓ PHIẾU PHẠT: dùng ngày lập phiếu - hạn
        WHEN fd.id IS NOT NULL
          THEN GREATEST(
                 DATEDIFF(
                   DATE(ft.issued_date),
                   bd.due_date
                 ),
                 0
               )

        -- CHƯA PHẠT & đang mượn / expired & quá hạn: hôm nay - hạn
        WHEN fd.id IS NULL
         AND bd.status IN ('on_loan', 'expired')
         AND bd.due_date < CURRENT_DATE
          THEN GREATEST(
                 DATEDIFF(
                   CURRENT_DATE,
                   bd.due_date
                 ),
                 0
               )

        ELSE 0
      END AS overdue_days,

      -- Thông tin phiếu phạt (nếu có)
      fd.id           AS fine_detail_id,
      fd.amount       AS fine_amount,
      ft.id           AS fine_ticket_id,
      ft.status       AS fine_status

    FROM borrow_details bd
    JOIN borrow_tickets bt ON bd.borrow_id = bt.id
    JOIN users u           ON bt.user_id = u.id
    JOIN records r         ON bd.record_id = r.id
    JOIN documents d       ON r.doc_id = d.id

    LEFT JOIN fines_detail fd
      ON fd.loan_item_id = bd.id
    LEFT JOIN fine_tickets ft
      ON ft.id = fd.fine_id

    WHERE
      (
        -- Nhóm 1: đang mượn và quá hạn (kể cả đã/ chưa phạt)
        bd.status = 'expired'
        AND bd.due_date < CURRENT_DATE
      )
      OR
      (
        -- Nhóm 2: đã có phiếu phạt (lost / returned / on_loan / expired)
        fd.id IS NOT NULL
      )
      OR
      (
        -- Nhóm 3: lost (nếu bạn muốn luôn thấy bản mất trong báo cáo phạt)
        bd.status = 'lost'
      )

    ORDER BY
      bd.due_date ASC,
      u.username ASC,
      d.name ASC
    `
  );

  return rows;
};

/**
 * Báo cáo chi tiết từng bản ghi theo kệ (snapshot hiện tại, không lọc ngày)
 *
 * Trả về:
 * - shelf_id: id kệ (location_id)
 * - shelf_code: tên/mã kệ (location.location)
 * - doc_id: Mã đầu sách
 * - doc_name: Tên sách
 * - barcode: barcode bản ghi
 * - condition_note: ghi chú tình trạng
 * - state: 'borrowed' | 'holding' | 'lost' | 'damaged' | 'available'
 * - borrow_ticket_id: nếu đang mượn / mất
 * - hold_ticket_id: nếu đang giữ
 */
const getShelfBookDetails = async () => {
  const sql = `
    SELECT
      loc.id          AS shelf_id,
      loc.location    AS shelf_code,
      d.id            AS doc_id,
      d.name          AS doc_name,
      r.barcode       AS barcode,
      r.condition_note AS condition_note,

      CASE
        WHEN bd_active.id IS NOT NULL AND bd_active.status IN ('on_loan', 'expired')
          THEN 'borrowed'
        WHEN bd_lost.id IS NOT NULL
          THEN 'lost'
        WHEN hd_active.id IS NOT NULL
          THEN 'holding'
        ELSE 'available'
      END AS state,

      bt_active.id    AS borrow_ticket_id,
      ht_active.id    AS hold_ticket_id

    FROM records r
    JOIN documents d      ON r.doc_id = d.id
    LEFT JOIN locations loc ON r.location_id = loc.id

    -- Chi tiết mượn đang còn hiệu lực (chưa trả)
    LEFT JOIN borrow_details bd_active
      ON bd_active.record_id = r.id
      AND bd_active.status IN ('on_loan', 'expired')
    LEFT JOIN borrow_tickets bt_active
      ON bd_active.borrow_id = bt_active.id

    -- Chi tiết mượn bị mất
    LEFT JOIN borrow_details bd_lost
      ON bd_lost.record_id = r.id
      AND bd_lost.status = 'lost'

    -- Phiếu giữ đang hiệu lực (đổi tên bảng/cột nếu khác)
    LEFT JOIN reservation_details hd_active
      ON hd_active.record_id = r.id
      AND hd_active.status = 'on_hold'
    LEFT JOIN reservation_tickets ht_active
      ON hd_active.reservation_id = ht_active.id

    WHERE r.is_active = 1
  `;

  const [rows] = await pool.query(sql);
  return rows;
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
  markBookAsLost,
  returnAllBooks,
  getBorrowsByUser,
  getBorrowSummary,
  getBorrowSummaryByBook,
  getBorrowSummaryByUsers,
  getBorrowReportByUsers,
  getShelfBookDetails,
  getOverdueLostReport,
  returnFromLoanItems,
};
