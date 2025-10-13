const express = require("express");
const router = express.Router();
const authToken = require("../middleware/authToken");
const {
  createBorrow,
  getMyBorrows,
  getAllBorrows,
  returnBook,
  updateBorrowStatus,
} = require("../controllers/borrowController");

// Reader tạo phiếu mượn
router.post("/", authToken, createBorrow);

// Reader xem phiếu mượn của mình (lọc ngày nếu có)
router.get("/me", authToken, getMyBorrows);

// Librarian xem tất cả phiếu mượn
router.get("/", authToken, getAllBorrows);

// Trả sách (chi tiết mượn)
router.put("/return/:detail_id", authToken, returnBook);

// Cập nhật trạng thái phiếu mượn (active/closed)
router.put("/:id/status", authToken, updateBorrowStatus);

module.exports = router;
