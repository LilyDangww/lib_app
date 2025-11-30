const User = require("../models/userModel");

// 1. Thủ thư thêm user (mật khẩu mặc định 000000)
const createUserByLibrarian = async (req, res) => {
  try {
    // Chỉ cần username và phone
    const { username, phone } = req.body;

    if (!username || !username.trim()) {
      return res.status(400).json({ message: "Tên không được để trống" });
    }
    if (!phone || !phone.trim()) {
      return res
        .status(400)
        .json({ message: "Số điện thoại không được để trống" });
    }
    if (!/^\d{9,11}$/.test(phone)) {
      return res.status(400).json({ message: "Số điện thoại không hợp lệ" });
    }

    // Model giờ chỉ nhận 2 tham số
    await User.createUserByLibrarian(username.trim(), phone.trim());

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

// Lấy tất cả users với pagination và search
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const searchTerm = search && search.trim() ? search.trim() : null;

    const result = await User.getAllUsers(pageNum, limitNum, searchTerm);
    res.json(result);
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

// Người dùng tự chỉnh sửa thông tin của chính mình
const editUserSelf = async (req, res) => {
  try {
    const userId = req.user.id; // Lấy ID từ token
    const affected = await User.updateUser(userId, req.body);
    if (!affected) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User updated successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error updating user", error: error.message });
  }
};

// Thủ thư chỉnh sửa thông tin người dùng (chỉ được phép chỉnh sửa số điện thoại và trạng thái hoạt động)
const editUserByLibrarian = async (req, res) => {
  try {
    const { phone, is_active } = req.body;

    // Chỉ cho phép chỉnh sửa các trường được phép
    const updateData = {};
    if (phone !== undefined) updateData.phone = phone;
    if (is_active !== undefined) updateData.is_active = is_active;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    const affected = await User.updateUser(req.params.id, updateData);
    if (!affected) return res.status(404).json({ message: "User not found" });

    res.json({
      message: "User updated by librarian",
      updatedFields: updateData,
    });
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

// Người dùng tự xem thông tin bản thân (joined_at + role names)
const getSelfProfile = async (req, res) => {
  try {
    const me = await User.getSelfProfile(req.user.id);
    if (!me) return res.status(404).json({ message: "User not found" });
    return res.json(me);
  } catch (error) {
    console.error("❌ Error in getSelfProfile:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createUserByLibrarian,
  registerUser,
  getUserByEmail,
  getUsers,
  getUser,
  editUserSelf,
  editUserByLibrarian,
  removeUser,
  getSelfProfile, // added
};
