const express = require("express");
const router = express.Router();
const {
  getDetailsByBorrowId,
  getDetailById,
  addDetail,
  updateDetail,
  deleteDetail,
} = require("../controllers/borrowDetailController");

// Lấy danh sách chi tiết theo borrow_id
// GET /api/borrow-details/borrow/:borrowId
router.get("/borrow/:borrowId", getDetailsByBorrowId);

// Lấy chi tiết mượn theo id
// GET /api/borrow-details/:id
router.get("/:id", getDetailById);

// Thêm chi tiết mượn
// POST /api/borrow-details
router.post("/", addDetail);

// Cập nhật chi tiết mượn
// PUT /api/borrow-details/:id
router.put("/:id", updateDetail);

// Xoá chi tiết mượn
// DELETE /api/borrow-details/:id
router.delete("/:id", deleteDetail);

module.exports = router;
