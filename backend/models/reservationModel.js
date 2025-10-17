const pool = require("../config/db");

// Tạo phiếu giữ và chi tiết cùng lúc
const createReservationWithDetails = async (
  user_id,
  hold_type = "hard", // gán mặc định hard nếu không truyền
  record_ids,
  note = null
) => {
  if (!record_ids || record_ids.length === 0) {
    throw new Error("Cần chọn ít nhất 1 bản ghi để giữ");
  }
  if (record_ids.length > 2) {
    throw new Error("Một phiếu giữ chỉ được phép tối đa 2 bản ghi");
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Kiểm tra số lượng sách user đang giữ (chưa completed/cancelled)
    const [activeHold] = await conn.query(
      `
      SELECT COUNT(rd.id) AS cnt
      FROM reservation_tickets rt
      JOIN reservation_details rd ON rt.id = rd.reservation_id
      WHERE rt.user_id = ?
        AND rt.status IN ('processing','on_hold')
        AND rd.status IN ('pending','on_hold')
      `,
      [user_id]
    );

    if (activeHold[0].cnt + record_ids.length > 2) {
      throw new Error(
        "Một người dùng chỉ được phép giữ tối đa 2 bản ghi tại một thời điểm"
      );
    }

    // Tạo phiếu giữ
    const [ticketResult] = await conn.query(
      `INSERT INTO reservation_tickets (user_id, hold_type, status, request_date, note)
       VALUES (?, ?, 'processing', NOW(), ?)`,
      [user_id, hold_type, note]
    );

    const reservationId = ticketResult.insertId;

    // Thêm chi tiết giữ cho từng record
    for (let record_id of record_ids) {
      // Kiểm tra record phải available
      const [[record]] = await conn.query(
        `SELECT status FROM records WHERE id = ?`,
        [record_id]
      );

      if (!record) throw new Error(`Record ${record_id} không tồn tại`);
      if (record.status !== "available") {
        throw new Error(`Record ${record_id} không khả dụng`);
      }

      // Insert chi tiết giữ
      await conn.query(
        `INSERT INTO reservation_details (reservation_id, record_id, status, hold_start_at, default_expire_at)
         VALUES (?, ?, 'pending', NULL, NULL)`,
        [reservationId, record_id]
      );
    }

    await conn.commit();
    return { reservationId, record_ids, hold_type };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

// Lấy danh sách phiếu giữ (lọc trạng thái + ngày request)
const getReservations = async (status = null, date = null) => {
  let query = `
    SELECT r.id, r.user_id, u.username, r.hold_type, r.status, r.request_date, r.note
    FROM reservation_tickets r
    JOIN users u ON r.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    query += " AND r.status = ?";
    params.push(status);
  }

  if (date) {
    query += " AND DATE(r.request_date) = ?";
    params.push(date);
  }

  const [rows] = await pool.query(query, params);
  return rows;
};

// // Lấy chi tiết 1 phiếu giữ (gồm thông tin sách và bạn đọc)
// const getReservationWithDetails = async (reservation_id) => {
//   const [rows] = await pool.query(
//     `
//     SELECT
//       rt.id AS reservation_id,
//       rt.user_id,
//       u.username AS user_name,
//       rt.hold_type,
//       rt.status AS reservation_status,
//       rt.request_date,
//       rt.note,

//       rd.id AS detail_id,
//       rd.status AS detail_status,
//       rd.hold_start_at,
//       rd.default_expire_at,

//       r.barcode,
//       d.name AS document_name,
//       l.location AS location_name
//     FROM reservation_tickets rt
//     JOIN users u ON rt.user_id = u.id
//     LEFT JOIN reservation_details rd ON rt.id = rd.reservation_id
//     LEFT JOIN records r ON rd.record_id = r.id
//     LEFT JOIN documents d ON r.doc_id = d.id
//     LEFT JOIN locations l ON r.location_id = l.id
//     WHERE rt.id = ?
//     `,
//     [reservation_id]
//   );
//   return rows;
// };

// Lấy phiếu giữ theo ID
const getReservationById = async (id) => {
  const [rows] = await pool.query(
    `SELECT r.*, u.username 
     FROM reservation_tickets r 
     JOIN users u ON r.user_id = u.id 
     WHERE r.id = ?`,
    [id]
  );
  return rows[0];
};
const confirmReservationDetails = async (reservation_id) => {
  await pool.query(
    `UPDATE reservation_details
     SET status = 'on_hold',
         hold_start_at = NOW(),
         default_expire_at = DATE_ADD(NOW(), INTERVAL 2 DAY)
     WHERE reservation_id = ? AND status = 'pending'`,
    [reservation_id]
  );
};

const updateReservationDetailByBarcode = async (barcode, status) => {
  await pool.query(
    `UPDATE reservation_details rd
     JOIN records r ON rd.record_id = r.id
     SET rd.status = ?
     WHERE r.barcode = ?`,
    [status, barcode]
  );

  // Sau khi update, kiểm tra tự động đóng phiếu giữ nếu cần
  await pool.query(
    `UPDATE reservation_tickets rt
     SET rt.status = 'closed'
     WHERE rt.id = (
       SELECT reservation_id FROM reservation_details rd2 
       JOIN records r2 ON rd2.record_id = r2.id
       WHERE r2.barcode = ?
       LIMIT 1
     )
     AND NOT EXISTS (
       SELECT 1 FROM reservation_details rd3
       WHERE rd3.reservation_id = rt.id
       AND rd3.status IN ('pending', 'on_hold')
     )`,
    [barcode]
  );
};

const updateReservationStatus = async (id, status) => {
  const [result] = await pool.query(
    `UPDATE reservation_tickets SET status = ? WHERE id = ?`,
    [status, id]
  );
  return result.affectedRows > 0;
};

// Xoá phiếu giữ
const deleteReservation = async (id) => {
  await pool.query(`DELETE FROM reservation_details WHERE reservation_id = ?`, [
    id,
  ]);
  const [result] = await pool.query(
    `DELETE FROM reservation_tickets WHERE id = ?`,
    [id]
  );
  return result.affectedRows > 0;
};
// Lấy chi tiết giữ theo id phiếu giữ (có thể lọc trạng thái)
const getReservationDetailsByTicket = async (reservation_id, status = null) => {
  let query = `
    SELECT 
      rd.id AS detail_id,
      rd.reservation_id,
      rd.record_id,
      r.barcode,
      d.name AS document_name,
      GROUP_CONCAT(a.name SEPARATOR ', ') AS author_names,
      rd.status,
      rd.hold_start_at,
      rd.default_expire_at
    FROM reservation_details rd
    JOIN records r ON rd.record_id = r.id
    JOIN documents d ON r.doc_id = d.id
    LEFT JOIN doc_authors da ON d.id = da.doc_id
    LEFT JOIN authors a ON da.author_id = a.id
    WHERE rd.reservation_id = ?
  `;

  const params = [reservation_id];

  if (status) {
    query += " AND rd.status = ?";
    params.push(status);
  }

  query += `
    GROUP BY rd.id, rd.reservation_id, rd.record_id, r.barcode, d.name,
             rd.status, rd.hold_start_at, rd.default_expire_at
  `;

  const [rows] = await pool.query(query, params);
  return rows;
};

module.exports = {
  createReservationWithDetails,
  getReservations,
  getReservationById,
  confirmReservationDetails,
  updateReservationDetailByBarcode,
  updateReservationStatus,
  deleteReservation,
  getReservationDetailsByTicket,
};
