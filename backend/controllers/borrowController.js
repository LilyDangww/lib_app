const Borrow = require("../models/borrowModel");
const { get } = require("../routes/documentRoutes");

const getUserBorrows = async (req, res) => {
  try {
    const { id } = req.params; // userId
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await Borrow.getBorrowedBooksByUser(id, page, limit);
    res.json(result);
  } catch (error) {
    console.error("❌ Error in getUserBorrows:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Tạo phiếu mượn
const createBorrow = async (req, res) => {
  try {
    const { user_id, borrow_date, due_date, recordIds } = req.body;
    if (!user_id || !recordIds || recordIds.length === 0) {
      return res
        .status(400)
        .json({ message: "user_id và recordIds là bắt buộc" });
    }
    const borrow = await Borrow.createBorrow(
      user_id,
      borrow_date,
      due_date,
      recordIds
    );
    res.status(201).json(borrow);
  } catch (error) {
    console.error("❌ Error createBorrow:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Lấy danh sách phiếu mượn
const getBorrows = async (req, res) => {
  try {
    const borrows = await Borrow.getBorrows();
    res.json(borrows);
  } catch (error) {
    console.error("❌ Error getBorrows:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Lấy chi tiết phiếu mượn
const getBorrowById = async (req, res) => {
  try {
    const { id } = req.params;
    const borrow = await Borrow.getBorrowById(id);
    if (!borrow || borrow.length === 0) {
      return res.status(404).json({ message: "Borrow not found" });
    }
    res.json(borrow);
  } catch (error) {
    console.error("❌ Error getBorrowById:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Cập nhật phiếu mượn
const updateBorrow = async (req, res) => {
  try {
    const { id } = req.params;
    const borrow = await Borrow.updateBorrow(id, req.body);
    res.json(borrow);
  } catch (error) {
    console.error("❌ Error updateBorrow:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Xoá phiếu mượn
const deleteBorrow = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Borrow.deleteBorrow(id);
    res.json(result);
  } catch (error) {
    console.error("❌ Error deleteBorrow:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createBorrow,
  getBorrows,
  getBorrowById,
  updateBorrow,
  deleteBorrow,
  getUserBorrows,
};
