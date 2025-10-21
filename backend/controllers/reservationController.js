const Reservation = require("../models/reservationModel");

// Tạo phiếu giữ
const createReservation = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { hold_type, record_ids, note } = req.body;
    const reservationId = await Reservation.createReservationWithDetails(
      user_id,
      hold_type,
      record_ids,
      note
    );
    res.status(201).json({
      message: "Reservation created successfully",
      reservationId,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// User xem danh sách phiếu giữ
const getReservations = async (req, res) => {
  try {
    const { status, date } = req.query;
    const reservations = await Reservation.getReservationWithDetails(
      status,
      date
    );
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// User xem chi tiết phiếu giữ (sách)
const getReservationWithDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, sort } = req.query;
    const reservation = await Reservation.getUserReservationsWithDetails(
      id,
      status,
      sort
    );
    if (!reservation) return res.status(404).json({ message: "Not found" });
    res.json(reservation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Thủ thư xem danh sách phiếu giữ
const getReservationsForLibrarian = async (req, res) => {
  try {
    const { status, startDate, endDate, sort } = req.query;
    const reservations =
      await Reservation.getAllReservationsWithDetailsForLibrarian(
        status,
        startDate,
        endDate,
        sort
      );
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Thủ thư xác nhận phiếu giữ
const confirmReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const reservation = await Reservation.getReservationById(id);
    if (!reservation) return res.status(404).json({ message: "Not found" });

    await Reservation.updateReservationStatus(id, "active");
    await Reservation.confirmReservationDetails(id);

    res.json({ message: "Reservation confirmed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Thủ thư cập nhật trạng thái chi tiết giữ theo detail_id
const updateReservationDetail = async (req, res) => {
  try {
    const { detail_id } = req.params; // FE truyền id chi tiết
    const { status } = req.body; // picked_up, cancelled, expired, ...

    if (!status) {
      return res.status(400).json({ message: "Missing status" });
    }

    const ok = await Reservation.updateReservationDetailById(detail_id, status);

    if (!ok) {
      return res.status(404).json({ message: "Reservation detail not found" });
    }

    res.json({ message: `Reservation detail updated to ${status}` });
  } catch (error) {
    console.error("❌ Error in updateReservationDetail:", error);
    res.status(500).json({ message: error.message });
  }
};

// Hủy phiếu giữ
const cancelReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const ok = await Reservation.deleteReservation(id);
    if (!ok) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Reservation cancelled" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createReservation,
  getReservations,
  getReservationWithDetails,
  getReservationsForLibrarian,
  confirmReservation,
  updateReservationDetail,
  cancelReservation,
};
