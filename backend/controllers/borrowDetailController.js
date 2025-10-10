const BorrowDetail = require("../models/borrowDetailModel");

// Lấy chi tiết theo borrow_id
const getDetailsByBorrowId = async (req, res) => {
  try {
    const { borrowId } = req.params;
    const details = await BorrowDetail.getDetailsByBorrowId(borrowId);
    res.json(details);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Lấy 1 borrow_detail theo id
const getDetailById = async (req, res) => {
  try {
    const { id } = req.params;
    const detail = await BorrowDetail.getDetailById(id);
    if (!detail)
      return res.status(404).json({ message: "Borrow detail not found" });
    res.json(detail);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Thêm chi tiết mượn (khi tạo phiếu mượn thì thêm từng bản ghi vào đây)
const addDetail = async (req, res) => {
  try {
    const { borrow_id, record_id, hold_id } = req.body;
    const inserted = await BorrowDetail.addDetail(
      borrow_id,
      record_id,
      hold_id
    );
    res
      .status(201)
      .json({ message: "Borrow detail added", id: inserted.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Cập nhật trạng thái chi tiết mượn (vd: trả sách, quá hạn)
const updateDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, return_date } = req.body;
    const success = await BorrowDetail.updateDetailStatus(
      id,
      status,
      return_date
    );
    if (!success)
      return res.status(404).json({ message: "Borrow detail not found" });
    res.json({ message: "Borrow detail updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Xoá chi tiết mượn
const deleteDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const success = await BorrowDetail.deleteDetail(id);
    if (!success)
      return res.status(404).json({ message: "Borrow detail not found" });
    res.json({ message: "Borrow detail deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getDetailsByBorrowId,
  getDetailById,
  addDetail,
  updateDetail,
  deleteDetail,
};
