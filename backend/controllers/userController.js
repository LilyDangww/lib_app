const User = require("../models/userModel");
// 1. Thủ thư thêm user (mật khẩu mặc định 000000)
const createUserByLibrarian = async (req, res) => {
  try {
    const { username, gender, email, dob, phone } = req.body;

    await User.createUserByLibrarian(username, gender, email, dob, phone);

    res.status(201).json({
      message:
        "User created successfully by librarian (default password: 000000)",
    });
  } catch (error) {
    console.error("❌ Error in createUserByLibrarian:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 2. Đăng ký user (reader tự đăng ký)
const registerUser = async (req, res) => {
  try {
    const { username, gender, email, dob, phone, password } = req.body;

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await User.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    await User.registerUser(username, gender, email, dob, phone, password);

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("❌ Error in registerUser:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 3. Lấy user theo email
const getUserByEmail = async (req, res) => {
  try {
    const { email } = req.params;

    const user = await User.getUserByEmail(email);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (error) {
    console.error("❌ Error in getUserByEmail:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Lấy tất cả users
const getUsers = async (req, res) => {
  try {
    const users = await User.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error fetching users", error: error.message });
  }
};

// Lấy user theo ID
const getUser = async (req, res) => {
  try {
    const user = await User.getUserById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error fetching user", error: error.message });
  }
};

// Cập nhật user
const editUser = async (req, res) => {
  try {
    const affected = await User.updateUser(req.params.id, req.body);
    if (!affected) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User updated" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error updating user", error: error.message });
  }
};

// Xóa user
const removeUser = async (req, res) => {
  try {
    const affected = await User.deleteUser(req.params.id);
    if (!affected) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted (set inactive)" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error deleting user", error: error.message });
  }
};

module.exports = {
  createUserByLibrarian,
  registerUser,
  getUserByEmail,
  getUsers,
  getUser,
  editUser,
  removeUser,
};
