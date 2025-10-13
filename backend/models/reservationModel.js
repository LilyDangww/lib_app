const pool = require("../config/db");

// Tạo phiếu giữ
const createReservation = async (user_id, type, expire_date) => {
  const [result] = await pool.query(
    `INSERT INTO reservations (user_id, type, status, created_at, expire_date)
     VALUES (?, ?, 'processing', NOW(), ?)`,
    [user_id, type, expire_date]
  );
  return result.insertId;
};

// Thêm chi tiết giữ
const addReservationDetail = async (reservation_id, record_id) => {
  const [countRows] = await pool.query(
    `SELECT COUNT(*) as cnt FROM reservation_details WHERE reservation_id = ?`,
    [reservation_id]
  );
  if (countRows[0].cnt >= 2) {
    throw new Error("Một phiếu giữ chỉ được phép tối đa 2 bản ghi.");
  }

  await pool.query(
    `INSERT INTO reservation_details (reservation_id, record_id, status)
     VALUES (?, ?, 'pending')`,
    [reservation_id, record_id]
  );
};

// Lấy phiếu giữ theo ngày đặt giữ
const getReservations = async (status = null, date = null) => {
  let query = `
      SELECT r.id, r.user_id, u.username, r.type, r.status, r.created_at, r.expire_date
      FROM reservations r
      JOIN users u ON r.user_id = u.id
      WHERE 1=1
    `;
  const params = [];

  if (status) {
    query += " AND r.status = ?";
    params.push(status);
  }

  if (date) {
    query += " AND DATE(r.created_at) = ?";
    params.push(date);
  }

  const [rows] = await pool.query(query, params);
  return rows;
};

// Lấy phiếu giữ theo id
const getReservationById = async (id) => {
  const [rows] = await pool.query(
    `SELECT r.*, u.username 
     FROM reservations r 
     JOIN users u ON r.user_id = u.id 
     WHERE r.id = ?`,
    [id]
  );
  return rows[0];
};

// Cập nhật trạng thái phiếu giữ
const updateReservationStatus = async (id, status) => {
  const [result] = await pool.query(
    `UPDATE reservations SET status = ? WHERE id = ?`,
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
  const [result] = await pool.query(`DELETE FROM reservations WHERE id = ?`, [
    id,
  ]);
  return result.affectedRows > 0;
};

module.exports = {
  createReservation,
  addReservationDetail,
  getReservations,
  getReservationById,
  updateReservationStatus,
  updateReservationDetailsStatus,
  deleteReservation,
};
