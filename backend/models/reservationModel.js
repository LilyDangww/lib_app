const pool = require("../config/db");

// Tạo phiếu giữ
const createReservation = async (user_id, hold_type, note = null) => {
  const [result] = await pool.query(
    `INSERT INTO reservation_tickets (user_id, hold_type, status, request_date, note)
     VALUES (?, ?, 'processing', NOW(), ?)`,
    [user_id, hold_type, note]
  );
  return result.insertId;
};

// Thêm chi tiết giữ (mỗi phiếu tối đa 2 record)
const addReservationDetail = async (
  reservation_id,
  record_id,
  default_expire_at
) => {
  const [countRows] = await pool.query(
    `SELECT COUNT(*) as cnt FROM reservation_details WHERE reservation_id = ?`,
    [reservation_id]
  );
  if (countRows[0].cnt >= 2) {
    throw new Error("Một phiếu giữ chỉ được phép tối đa 2 bản ghi.");
  }

  await pool.query(
    `INSERT INTO reservation_details (reservation_id, record_id, status, hold_start_at, default_expire_at)
     VALUES (?, ?, 'pending', NOW(), ?)`,
    [reservation_id, record_id, default_expire_at]
  );
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

// Cập nhật trạng thái phiếu giữ
const updateReservationStatus = async (id, status) => {
  const [result] = await pool.query(
    `UPDATE reservation_tickets SET status = ? WHERE id = ?`,
    [status, id]
  );
  return result.affectedRows > 0;
};

// Cập nhật trạng thái chi tiết
const updateReservationDetailsStatus = async (reservation_id, status) => {
  await pool.query(
    `UPDATE reservation_details SET status = ? WHERE reservation_id = ?`,
    [status, reservation_id]
  );
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
  createReservation,
  addReservationDetail,
  getReservations,
  getReservationById,
  updateReservationStatus,
  updateReservationDetailsStatus,
  deleteReservation,
  getReservationDetailsByTicket,
};
