const express = require("express");
const router = express.Router();

const {
  createUserByLibrarian,
  registerUser,
  getUserByEmail,
  getUsers,
  getUser,
  editUser,
  removeUser,
} = require("../controllers/userController");

// CRUD
router.post("/", createUserByLibrarian); // Thêm user do thủ thư tạo (mật khẩu mặc định)
router.post("/register", registerUser); // Đăng ký user (reader tự đăng ký)
router.get("/email/:email", getUserByEmail); // Lấy user theo email
router.get("/", getUsers); // Lấy danh sách user
router.get("/:id", getUser); // Lấy 1 user theo id
router.put("/:id", editUser); // Cập nhật user
router.delete("/:id", removeUser); // Xóa user (soft delete)

module.exports = router;
