const express = require("express");
const router = express.Router();
const {
  createRecord,
  getRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
} = require("../controllers/recordController");

// ========== Routes cho records ==========

// Lấy danh sách bản ghi (có thể lọc theo doc_id)
router.get("/", getRecords);

// Lấy chi tiết 1 bản ghi
router.get("/:id", getRecordById);

// Thêm bản ghi mới
router.post("/", createRecord);

// Cập nhật bản ghi
router.put("/:id", updateRecord);

// Xóa bản ghi
router.delete("/:id", deleteRecord);

module.exports = router;
