const Fines = require("../models/finesModel");

const createFineFromLoanItem = async (req, res) => {
  try {
    const { loan_item_id, reason } = req.body;

    const fine_id = await Fines.createFineFromLoanItem(loan_item_id, reason);

    const fine = await Fines.getFine(fine_id);

    res.status(201).json({
      message: "Fine created successfully",
      fine,
    });
  } catch (err) {
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

module.exports = {
  createFineFromLoanItem,
  createFineDirect,
  getFine,
};
