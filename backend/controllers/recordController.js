const Record = require("../models/recordModel");

// @desc    Tạo bản ghi mới (quyển sách)
// @route   POST /api/records
// @access  Admin/Thủ thư
const createRecord = async (req, res) => {
  try {
    const { doc_id, barcode, location_id, status, condition_note } = req.body;

    if (!doc_id || !barcode) {
      return res.status(400).json({ message: "doc_id và barcode là bắt buộc" });
    }

    const newRecord = await Record.createRecord(
      doc_id,
      barcode,
      location_id,
      status,
      condition_note
    );
    res.status(201).json(newRecord);
  } catch (error) {
    console.error("❌ Error in createRecord:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Lấy danh sách bản ghi (có thể lọc theo doc_id)
// @route   GET /api/records?doc_id=1
// @access  Public (hoặc Admin tuỳ bạn)
// Lấy danh sách records (có thể lọc)
const getRecords = async (req, res) => {
  try {
    const { doc_id, status } = req.query; // nhận query string từ FE: ?doc_id=1&status=available

    const records = await Record.getRecords({ doc_id, status });

    res.json(records);
  } catch (error) {
    console.error("❌ Error in getRecords:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Lấy chi tiết một bản ghi
// @route   GET /api/records/:id
// @access  Public
const getRecordById = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await Record.getRecordById(id);

    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    res.json(record);
  } catch (error) {
    console.error("❌ Error in getRecordById:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Cập nhật record
const updateRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // Gọi model với data linh hoạt
    const updatedRecord = await Record.updateRecord(id, data);

    if (!updatedRecord) {
      return res.status(404).json({ message: "Record not found" });
    }

    res.json({
      message: "Record updated successfully",
      record: updatedRecord,
    });
  } catch (error) {
    console.error("❌ Error in updateRecord:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Xoá bản ghi
// @route   DELETE /api/records/:id
// @access  Admin/Thủ thư
// 📘 Xóa bản ghi (đánh dấu là removed)
const deleteRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Record.deleteRecord(id);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createRecord,
  getRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
};
