const Reservation = require("../models/reservationModel");

const { createReservationWithDetails } = require("../models/reservationModel");

const createReservation = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { hold_type, record_ids, note } = req.body;

    const reservationId = await createReservationWithDetails(
      user_id,
      hold_type,
      record_ids,
      note
    );

    res
      .status(201)
      .json({ message: "Reservation created successfully", reservationId });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Hiển thị danh sách phiếu giữ (lọc theo trạng thái + ngày đặt)
const getReservations = async (req, res) => {
  try {
    const status = req.query.status || null; // ví dụ: processing, confirmed
    const date = req.query.date || null; // ngày cụ thể: 2024-10-13

    const reservations = await Reservation.getReservations(status, date);
    res.json(reservations);
  } catch (error) {
    console.error("❌ Error in getReservations:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 3. Xem chi tiết phiếu giữ
const getReservationById = async (req, res) => {
  try {
    const reservation = await Reservation.getReservationById(req.params.id);
    if (!reservation) return res.status(404).json({ message: "Not found" });
    res.json(reservation);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
// 1. Thủ thư xác nhận phiếu giữ (toàn bộ chi tiết sang on_hold)
const confirmReservation = async (req, res) => {
  try {
    const { id } = req.params; // id phiếu giữ

    // Kiểm tra phiếu giữ có tồn tại không
    const reservation = await Reservation.getReservationById(id);
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    // Cập nhật phiếu giữ sang active
    await Reservation.updateReservationStatus(id, "active");

    // Cập nhật toàn bộ chi tiết giữ sang on_hold, set ngày giữ = NOW, hạn = NOW + 2
    await Reservation.confirmReservationDetails(id);

    res.json({ message: "Reservation confirmed successfully" });
  } catch (error) {
    console.error("❌ Error in confirmReservation:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 2. Thủ thư cập nhật trạng thái chi tiết giữ theo barcode
const updateReservationDetail = async (req, res) => {
  try {
    const { barcode } = req.params;
    const { status } = req.body; // ví dụ: picked_up, cancel, expired

    const ok = await Reservation.updateReservationDetailByBarcode(
      barcode,
      status
    );
    if (!ok) {
      return res.status(404).json({ message: "Reservation detail not found" });
    }

    // Sau khi cập nhật chi tiết, kiểm tra xem phiếu giữ có cần đóng không
    await Reservation.autoCloseReservationByBarcode(barcode);

    res.json({ message: `Reservation detail updated to ${status}` });
  } catch (error) {
    console.error("❌ Error in updateReservationDetail:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 5. Hủy phiếu giữ
const cancelReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const ok = await Reservation.deleteReservation(id);
    if (!ok) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Reservation cancelled" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
// controllers/reservationController.js
const getReservationDetails = async (req, res) => {
  try {
    const { id } = req.params; // reservation_id
    const status = req.query.status || null;
    const details = await Reservation.getReservationDetailsByTicket(id, status);
    res.json(details);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createReservation,
  getReservations,
  getReservationById,
  updateReservationDetail,
  confirmReservation,
  cancelReservation,
  getReservationDetails,
};
