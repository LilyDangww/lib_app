const express = require("express");
const router = express.Router();
const {
  createBorrow,
  getBorrows,
  getBorrowById,
  updateBorrow,
  deleteBorrow,
  getUserBorrows,
} = require("../controllers/borrowController");

// Lấy danh sách sách đã mượn của 1 user
router.get("/user/:id", getUserBorrows);

// Tạo phiếu mượn
router.post("/", createBorrow);

// Lấy danh sách phiếu mượn
router.get("/", getBorrows);

// Lấy chi tiết phiếu mượn
router.get("/:id", getBorrowById);

// Cập nhật phiếu mượn
router.put("/:id", updateBorrow);

// Xoá phiếu mượn
router.delete("/:id", deleteBorrow);

module.exports = router;
