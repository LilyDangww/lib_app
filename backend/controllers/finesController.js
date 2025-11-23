const Fines = require("../models/finesModel");

const createFineFromLoanItem = async (req, res) => {
  try {
    const { loan_item_id, reason, amount, overdue_days } = req.body;

    const fine_id = await Fines.createFineFromLoanItem(
      loan_item_id,
      reason,
      amount,
      overdue_days
    );

    const fine = await Fines.getFine(fine_id);

    res.status(201).json({
      message: "Fine created successfully",
      fine,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create fine ticket for multiple books at once
const createFineFromMultipleLoanItems = async (req, res) => {
  try {
    const { loan_items, reason } = req.body;

    if (!loan_items || !Array.isArray(loan_items) || loan_items.length === 0) {
      return res.status(400).json({
        message: "loan_items array is required and must not be empty",
      });
    }

    if (!reason || !["overdue", "lost", "custom"].includes(reason)) {
      return res.status(400).json({
        message: "Invalid reason. Must be 'overdue', 'lost', or 'custom'",
      });
    }

    // Validate each loan item has required fields
    for (const item of loan_items) {
      if (!item.loan_item_id) {
        return res.status(400).json({
          message: "Each loan item must have loan_item_id",
        });
      }
    }

    const fine_id = await Fines.createFineFromMultipleLoanItems(loan_items, reason);
    const fine = await Fines.getFine(fine_id);

    res.status(201).json({
      message: "Fine ticket created successfully for multiple books",
      fine,
    });
  } catch (err) {
    console.error("❌ Error createFineFromMultipleLoanItems:", err);
    res.status(500).json({ message: err.message });
  }
};

const createFineDirect = async (req, res) => {
  try {
    const { user_id, record_id, reason, amount, overdue_days } = req.body;

    if (!user_id || !record_id || !reason) {
      return res.status(400).json({
        message: "Missing required fields: user_id, record_id, reason",
      });
    }

    if (!["overdue", "lost", "custom"].includes(reason)) {
      return res.status(400).json({
        message: "Invalid reason. Must be 'overdue', 'lost', or 'custom'",
      });
    }

    const fine_id = await Fines.createFineDirect(
      user_id,
      record_id,
      reason,
      amount || 0,
      overdue_days || null
    );

    const fine = await Fines.getFine(fine_id);

    res.status(201).json({
      message: "Fine created successfully",
      fine,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getFine = async (req, res) => {
  const { id } = req.params;
  const fine = await Fines.getFine(id);
  if (!fine) {
    return res.status(404).json({ message: "Fine not found" });
  }
  res.json(fine);
};

// Lấy danh sách phiếu phạt
const getAllFines = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;

    const result = await Fines.getFines(pageNum, limitNum);
    res.json(result);
  } catch (error) {
    console.error("❌ Error getAllFines:", error);
    res.status(500).json({ message: error.message });
  }
};

// Cập nhật trạng thái phiếu phạt (confirm payment)
const updateFineStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !["paid", "unpaid"].includes(status)) {
      return res.status(400).json({
        message: "Invalid status. Must be 'paid' or 'unpaid'",
      });
    }

    await Fines.updateFineStatus(id, status);
    const fine = await Fines.getFine(id);

    res.json({
      message: `Fine ticket ${status === "paid" ? "confirmed" : "marked as unpaid"} successfully`,
      fine,
    });
  } catch (err) {
    console.error("❌ Error updateFineStatus:", err);
    res.status(500).json({ message: err.message });
  }
};

// Xóa phiếu phạt
const deleteFine = async (req, res) => {
  try {
    const { id } = req.params;

    await Fines.deleteFine(id);

    res.json({
      message: "Fine ticket deleted successfully",
    });
  } catch (err) {
    console.error("❌ Error deleteFine:", err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createFineFromLoanItem,
  createFineFromMultipleLoanItems,
  createFineDirect,
  getFine,
  getAllFines,
  updateFineStatus,
  deleteFine,
};
