const Borrow = require("../models/borrowModel");

// ================== Tạo phiếu mượn ==================
const createBorrow = async (req, res) => {
  try {
    const librarian_id = req.user.id; // Người thao tác
    const { user_id, records } = req.body; // Bạn đọc được mượn

    if (!user_id) {
      return res.status(400).json({ message: "Thiếu ID bạn đọc" });
    }

    if (!records || records.length === 0) {
      return res.status(400).json({ message: "Chưa chọn sách để mượn" });
    }

    if (records.length > 6) {
      return res
        .status(400)
        .json({ message: "Một phiếu mượn chỉ tối đa 6 quyển" });
    }

    // Model tự động tính due_date = borrow_date + 35 ngày
    const borrowInfo = await Borrow.createBorrow(user_id, records);

    res.status(201).json({
      message: "Tạo phiếu mượn thành công",
      borrow: borrowInfo,
      created_by: librarian_id, // để FE hiển thị nếu cần
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

    // Lấy theo chi tiết mượn + thông tin sách/record
    const rows = await Borrow.getBorrowsByUser(req.user.id, fromDate, toDate);

    const mapped = rows.map((r) => ({
      ...r,
      borrow_type: r.reservation_detail_id ? "online" : "at_library",
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
    const { fromDate, toDate, page = 1, limit = 10, status } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    
    // Validate status filter
    const validStatuses = ["active", "closed", "expired"];
    const statusFilter = status && validStatuses.includes(status) ? status : null;
    
    const result = await Borrow.getBorrows(fromDate, toDate, pageNum, limitNum, statusFilter);

    const mapped = result.data.map((r) => ({
      ...r,
      borrow_type: r.reservation_id ? "online" : "at_library",
    }));

    res.json({
      ...result,
      data: mapped
    });
  } catch (error) {
    console.error("❌ Error getAllBorrows:", error);
    res.status(500).json({ message: error.message });
  }
};

// Reader/Librarian trả sách
const returnBook = async (req, res) => {
  try {
    const { detailId } = req.params;
    const result = await Borrow.returnBook(detailId);
    await Borrow.updateBorrowTicketStatus(result.borrowId);
    res.json({ message: "Trả sách thành công", ...result });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Đánh dấu sách là mất
const markBookAsLost = async (req, res) => {
  try {
    const { detailId } = req.params;
    const result = await Borrow.markBookAsLost(detailId);
    await Borrow.updateBorrowTicketStatus(result.borrowId);
    res.json({ message: "Đã đánh dấu sách là mất", ...result });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Librarian trả tất cả sách trong phiếu mượn
const returnAllBooks = async (req, res) => {
  try {
    const { id } = req.params; // borrow_id
    const result = await Borrow.returnAllBooks(id);
    await Borrow.updateBorrowTicketStatus(result.borrowId);
    res.json({ 
      message: `Trả thành công ${result.totalReturned} quyển sách`, 
      ...result 
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Cron: quá hạn chi tiết mượn
const autoUpdateOverdue = async (_req, res) => {
  try {
    const result = await Borrow.autoUpdateOverdue();
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================== Lấy chi tiết phiếu mượn theo ID ==================
const getBorrowById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await Borrow.getBorrowById(id);

    if (!result) {
      return res.status(404).json({ message: "Phiếu mượn không tồn tại" });
    }

    res.json(result);
  } catch (error) {
    console.error("❌ Error getBorrowById:", error);
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

// ================== Lấy tóm tắt thống kê mượn ==================
const getBorrowSummary = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const summary = await Borrow.getBorrowSummary(page, limit);
    res.json(summary);
  } catch (error) {
    console.error("Error fetching borrow summary:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ================== Lấy tóm tắt thống kê mượn theo sách ==================
const getBorrowSummaryByBook = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const summary = await Borrow.getBorrowSummaryByBook(page, limit);
    res.json(summary);
  } catch (error) {
    console.error("Error fetching borrow summary by book:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createBorrow,
  getMyBorrows,
  getAllBorrows,
  getBorrowById,
  returnBook,
  markBookAsLost,
  returnAllBooks,
  updateBorrowStatus,
  autoUpdateOverdue,
  getBorrowSummary,
  getBorrowSummaryByBook,
};
