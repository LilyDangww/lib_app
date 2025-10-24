const Borrow = require("../models/borrowModel");

// ================== Tạo phiếu mượn ==================
const createBorrow = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { records, due_date } = req.body;

    if (!records || records.length === 0) {
      return res.status(400).json({ message: "No records provided" });
    }
    if (records.length > 6) {
      return res
        .status(400)
        .json({ message: "Cannot borrow more than 6 books" });
    }

    const borrowId = await Borrow.createBorrow(user_id, records, due_date);

    res.status(201).json({
      message: "Borrow created successfully",
      borrowId,
    });
  } catch (error) {
    console.error("❌ Error createBorrow:", error);
    res.status(500).json({ message: error.message });
  }
};

// ================== Lấy phiếu mượn của chính user ==================
const getMyBorrows = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;

    // Lọc theo ngày tạo phiếu mượn
    const rows = await Borrow.getBorrowsByUser(req.user.id, fromDate, toDate);

    // Map hiển thị: reservation_id != null => "online", ngược lại => "at library"
    const mapped = rows.map((r) => ({
      ...r,
      borrow_type: r.reservation_id ? "online" : "at_library",
    }));

    res.json(mapped);
  } catch (error) {
    console.error("❌ Error getMyBorrows:", error);
    res.status(500).json({ message: error.message });
  }
};

// ================== Lấy tất cả phiếu mượn cho thủ thư ==================
const getAllBorrows = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    const rows = await Borrow.getBorrows(fromDate, toDate);

    const mapped = rows.map((r) => ({
      ...r,
      borrow_type: r.reservation_id ? "online" : "at_library",
    }));

    res.json(mapped);
  } catch (error) {
    console.error("❌ Error getAllBorrows:", error);
    res.status(500).json({ message: error.message });
  }
};

// ================== Trả sách ==================
const returnBook = async (req, res) => {
  try {
    const { detail_id } = req.params;

    await Borrow.updateBorrowDetailStatus(detail_id, "returned");

    res.json({ message: "Book returned successfully" });
  } catch (error) {
    console.error("❌ Error returnBook:", error);
    res.status(500).json({ message: error.message });
  }
};

// ================== Cập nhật trạng thái phiếu mượn ==================
const updateBorrowStatus = async (req, res) => {
  try {
    const { id } = req.params; // borrow_id
    const { status } = req.body; // chỉ active hoặc closed

    if (!["active", "closed"].includes(status)) {
      return res.status(400).json({ message: "Invalid borrow status" });
    }

    await Borrow.updateBorrowStatus(id, status);
    res.json({ message: `Borrow status updated to ${status}` });
  } catch (error) {
    console.error("❌ Error updateBorrowStatus:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createBorrow,
  getMyBorrows,
  getAllBorrows,
  returnBook,
  updateBorrowStatus,
};
