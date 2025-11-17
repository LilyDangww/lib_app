const Dashboard = require("../models/dashboardModel");

function normalizeDocStatus(raw = {}) {
  return {
    reserved_pending: Number(
      raw.reserved_pending ??
        raw.reservedPending ??
        raw.reservations_pending ??
        0
    ),
    available: Number(
      raw.available ?? raw.available_count ?? raw.documents_available ?? 0
    ),
    on_hold: Number(raw.on_hold ?? raw.onHold ?? raw.reservations_on_hold ?? 0),
    on_loan: Number(
      raw.on_loan ?? raw.onLoan ?? raw.borrowed ?? raw.documents_on_loan ?? 0
    ),
    lost: Number(raw.lost ?? raw.lost_count ?? raw.documents_lost ?? 0),
  };
}

const getDashboardStats = async (req, res) => {
  try {
    const { from, to } = req.query; // from, to: 'YYYY-MM-DD' (optional)

    const [
      readerStats,
      borrowStats,
      borrowedDocs,
      penaltyStats,
      topBooks,
      topUsers,
      docStatusRaw,
      activeTicketsRow,
      borrowReturnChart,
    ] = await Promise.all([
      Dashboard.getReaderStats(),
      Dashboard.getBorrowStats(),
      Dashboard.getBorrowedDocumentStats(), // -> books_on_loan
      Dashboard.getPenaltyStats(),
      Dashboard.getTopBooks(),
      Dashboard.getTopUsers(),
      Dashboard.getDocumentStatusStats(),
      Dashboard.getActiveBorrowTicketCount(), // -> active_borrow_tickets
      Dashboard.getBorrowReturnChart(from, to), // truyền khoảng ngày xuống model
    ]);

    const docStatus = normalizeDocStatus(docStatusRaw);
    const booksOnLoan = Number(borrowedDocs?.total_onloan || 0);
    const activeBorrowTickets = Number(activeTicketsRow?.active_tickets || 0);
    const booksPerActiveTicket = activeBorrowTickets
      ? Number((booksOnLoan / activeBorrowTickets).toFixed(2))
      : 0;

    res.json({
      summary: {
        // Tổng bản ghi theo trạng thái
        documents_total:
          docStatus.reserved_pending +
          docStatus.available +
          docStatus.on_hold +
          docStatus.on_loan +
          docStatus.lost,
        documents_active: docStatus.available,

        // Người dùng & mượn
        users_total: readerStats.total_readers,

        // Chỉ cần tổng đang mượn (số cuốn)
        books_on_loan: booksOnLoan,

        // Tùy chọn hiển thị thêm:
        active_borrow_tickets: activeBorrowTickets,
        books_per_active_ticket: booksPerActiveTicket,

        // Giữ nguyên nếu frontend vẫn dùng
        borrows_total: borrowStats.total_borrows,
        borrows_on_loan: booksOnLoan, // alias cũ -> trỏ về cùng giá trị
        borrows_overdue: 0,

        // Đặt theo trạng thái giữ chỗ
        reservations_total: null,
        reservations_pending: docStatus.reserved_pending,
        reservations_active: docStatus.on_hold,
      },
      borrowReturnChart, // giờ là số SÁCH mượn/trả theo từng ngày trong khoảng from - to
      topBooks,
      topUsers,
      documentsStatus: docStatus,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
};

module.exports = { getDashboardStats };
