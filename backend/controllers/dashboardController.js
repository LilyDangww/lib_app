const Dashboard = require("../models/dashboardModel");

exports.getDashboardStats = async (req, res) => {
  try {
    const [readers, borrows, documentsOnLoan, penalties, topBooks, topUsers] =
      await Promise.all([
        Dashboard.getReaderStats(),
        Dashboard.getBorrowStats(),
        Dashboard.getBorrowedDocumentStats(),
        Dashboard.getPenaltyStats(),
        Dashboard.getTopBooks(),
        Dashboard.getTopUsers(),
      ]);

    res.json({
      readers,
      borrows,
      documentsOnLoan,
      penalties,
      topBooks,
      topUsers,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server error",
      error: err,
    });
  }
};
