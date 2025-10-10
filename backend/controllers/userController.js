const User = require("../models/userModel");

// Tạo user
const addUser = async (req, res) => {
  try {
    const userId = await User.createUser(req.body);
    res.status(201).json({ message: "User created", id: userId });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error creating user", error: error.message });
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
  addUser,
  getUsers,
  getUser,
  editUser,
  removeUser,
};
