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

const getFine = async (req, res) => {
  const { id } = req.params;
  const fine = await Fines.getFine(id);
  res.json(fine);
};

module.exports = {
  createFineFromLoanItem,
  getFine,
};
