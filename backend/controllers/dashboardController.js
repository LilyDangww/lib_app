const Dashboard = require("../models/dashboardModel");

const normalizeDocStatus = (raw = {}) => ({
  reserved_pending: Number(raw.reserved_pending || 0),
  available: Number(raw.available || 0),
  on_hold: Number(raw.on_hold || 0),
  on_loan: Number(raw.on_loan || 0),
  lost: Number(raw.lost || 0),
});

const getDashboardStats = async (req, res) => {
  try {
    const [
      readerStats,
      borrowStats,
      borrowedDocs,
      penaltyStats,
      topBooks,
      topUsers,
      docStatusRaw,
      activeTicketsRow,
      borrowReturnChart, // thống kê mượn/trả theo ngày trong THÁNG HIỆN TẠI
    ] = await Promise.all([
      Dashboard.getReaderStats(),
      Dashboard.getBorrowStats(),
      Dashboard.getBorrowedDocumentStats(), // tổng sách đang mượn (on_loan + expired)
      Dashboard.getPenaltyStats(), // tổng số phiếu phạt + tổng tiền phạt
      Dashboard.getTopBooks(), // top 5 sách
      Dashboard.getTopUsers(), // top 3 độc giả
      Dashboard.getDocumentStatusStats(), // sách theo tình trạng hiện tại
      Dashboard.getActiveBorrowTicketCount(), // số phiếu mượn đang hoạt động
      Dashboard.getBorrowReturnChartCurrentMonth(), // <-- mới
    ]);

    const docStatus = normalizeDocStatus(docStatusRaw);
    const booksOnLoan = Number(borrowedDocs?.total_onloan || 0);
    const activeBorrowTickets = Number(activeTicketsRow?.active_tickets || 0);
    const booksPerActiveTicket = activeBorrowTickets
      ? Number((booksOnLoan / activeBorrowTickets).toFixed(2))
      : 0;

    res.json({
      // 1) KHU VỰC “TỔNG QUAN HIỆN TẠI” (thẻ ở trên cùng)
      summary: {
        // tổng số sách (bản ghi) hiện tại
        documents_total:
          docStatus.reserved_pending +
          docStatus.available +
          docStatus.on_hold +
          docStatus.on_loan +
          docStatus.lost,

        documents_active: docStatus.available, // sách đang available
        users_total: readerStats.total_readers, // tổng độc giả
        books_on_loan: booksOnLoan, // tổng sách đang mượn (hiện tại)

        active_borrow_tickets: activeBorrowTickets, // tổng phiếu mượn đang hoạt động
        books_per_active_ticket: booksPerActiveTicket, // hỗ trợ hiển thị

        borrows_total: borrowStats.total_borrows, // tổng số phiếu mượn
        borrows_on_loan: booksOnLoan, // dùng lại
        borrows_overdue: 0, // nếu bạn chưa tính quá hạn

        reservations_total: null, // tạm thời không dùng
        reservations_pending: docStatus.reserved_pending,
        reservations_active: docStatus.on_hold,

        // tổng tiền phạt (hiện tại)
        penalties_total: penaltyStats.total_penalties || 0,
        penalties_amount: penaltyStats.total_amount || 0,
      },

      // 2) BIỂU ĐỒ MƯỢN / TRẢ THEO NGÀY TRONG THÁNG HIỆN TẠI
      // X = date, Y = borrow_count, return_count
      borrowReturnChart,

      // 3) SÁCH THEO TÌNH TRẠNG HIỆN TẠI (pie chart)
      documentsStatus: docStatus,

      // 4) TOP SÁCH + TOP ĐỘC GIẢ (top 5 / top 3)
      topBooks,
      topUsers,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
};

module.exports = { getDashboardStats };
