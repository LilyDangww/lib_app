const express = require("express");
const router = express.Router();
const {
  addUser,
  getUsers,
  getUser,
  editUser,
  removeUser,
} = require("../controllers/userController");

// CRUD
router.post("/", addUser); // Thêm user
router.get("/", getUsers); // Lấy danh sách user
router.get("/:id", getUser); // Lấy 1 user theo id
router.put("/:id", editUser); // Cập nhật user
router.delete("/:id", removeUser); // Xóa user (soft delete)

module.exports = router;
