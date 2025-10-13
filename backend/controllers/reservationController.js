const Reservation = require("../models/reservationModel");

// 1. Tạo phiếu giữ
const createReservation = async (req, res) => {
  try {
    const user_id = req.user.id; // lấy từ token
    const { type, expire_date, record_ids } = req.body;

    const reservationId = await Reservation.createReservation(
      user_id,
      type,
      expire_date
    );

    // Thêm chi tiết (có tối đa 2 bản ghi)
    for (let record_id of record_ids) {
      await Reservation.addReservationDetail(reservationId, record_id);
    }

    res.status(201).json({ message: "Reservation created", reservationId });
  } catch (error) {
    console.error("❌ Error in createReservation:", error);
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

// 4. Thủ thư xác nhận
const confirmReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const reservation = await Reservation.getReservationById(id);
    if (!reservation) return res.status(404).json({ message: "Not found" });

    await Reservation.updateReservationStatus(id, "on_hold");
    await Reservation.updateReservationDetailsStatus(id, "on_hold");

    res.json({ message: "Reservation confirmed" });
  } catch (error) {
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

module.exports = {
  createReservation,
  getReservations,
  getReservationById,
  confirmReservation,
  cancelReservation,
};
