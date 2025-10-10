const pool = require("../config/db");

// Tạo user mới
const createUser = async (user) => {
  const { username, password_hash, gender, email, dob, phone } = user;
  const [result] = await pool.query(
    `INSERT INTO users (username, password_hash, gender, email, dob, phone)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [username, password_hash, gender, email, dob, phone]
  );
  return result.insertId;
};

// Lấy tất cả users
const getAllUsers = async () => {
  const [rows] = await pool.query(
    `SELECT id, username, email, gender, dob, phone, is_active, created_at 
     FROM users WHERE is_active = 1`
  );
  return rows;
};

// Lấy user theo ID
const getUserById = async (id) => {
  const [rows] = await pool.query(
    `SELECT id, username, email, gender, dob, phone, is_active, created_at 
     FROM users WHERE id = ?`,
    [id]
  );
  return rows[0];
};

// Cập nhật user
const updateUser = async (id, user) => {
  const { username, gender, email, dob, phone } = user;
  const [result] = await pool.query(
    `UPDATE users 
     SET username = ?, gender = ?, email = ?, dob = ?, phone = ?
     WHERE id = ?`,
    [username, gender, email, dob, phone, id]
  );
  return result.affectedRows;
};

// Xóa user (soft delete: set is_active = false)
const deleteUser = async (id) => {
  const [result] = await pool.query(
    `UPDATE users SET is_active = 0 WHERE id = ?`,
    [id]
  );
  return result.affectedRows;
};

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};
