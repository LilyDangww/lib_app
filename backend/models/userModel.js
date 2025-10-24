const pool = require("../config/db");
const bcrypt = require("bcryptjs");

// Chỉ tạo user + role mặc định (password đã hash trước khi truyền vào)
const createUser = async (
  username,
  passwordHash,
  gender,
  email,
  dob,
  phone
) => {
  const query = `
    INSERT INTO users (username, password_hash, gender, email, dob, phone)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const [result] = await pool.query(query, [
    username,
    passwordHash,
    gender,
    email,
    dob,
    phone,
  ]);

  const userId = result.insertId;

  // Gán role mặc định là reader (id = 3)
  await pool.query(`INSERT INTO user_roles (user_id, role_id) VALUES (?, 3)`, [
    userId,
  ]);

  return userId;
};

// ====== 2. Thủ thư thêm user ======
// Không nhập mật khẩu, mặc định là "000000"
const createUserByLibrarian = async (username, gender, email, dob, phone) => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash("000000", salt);

  return await createUser(username, hashedPassword, gender, email, dob, phone);
};

// ====== 3. Đăng ký user (người đọc) ======
// Người dùng nhập mật khẩu → hash rồi gọi lại createUser
const registerUser = async (username, gender, email, dob, phone, password) => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  return await createUser(username, hashedPassword, gender, email, dob, phone);
};
// ====== 4. Lấy user theo email ======
const getUserByEmail = async (email) => {
  const [rows] = await pool.query(
    `
    SELECT u.*, ur.role_id
    FROM users u
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    WHERE u.email = ?
    `,
    [email]
  );
  return rows[0];
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
// Cập nhật user (chỉ update các trường có trong body)
const updateUser = async (id, user) => {
  const fields = [];
  const values = [];

  // Duyệt qua từng key trong object user
  for (let [key, value] of Object.entries(user)) {
    // Chỉ thêm nếu giá trị không undefined
    if (value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (fields.length === 0) {
    throw new Error("Không có dữ liệu để cập nhật");
  }

  values.push(id); // ID để đưa vào WHERE

  const [result] = await pool.query(
    `UPDATE users SET ${fields.join(", ")} WHERE id = ?`,
    values
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
  createUserByLibrarian,
  registerUser,
  createUser,
  getUserByEmail,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};
