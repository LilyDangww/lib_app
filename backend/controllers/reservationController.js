const Reservation = require("../models/reservationModel");
const pool = require("../config/db");

// Tạo phiếu giữ
const createReservation = async (req, res) => {
  try {
    const user_id = req.user.id;
    // ❌ bỏ hold_type, chỉ nhận document_ids + note
    const { document_ids, note } = req.body;

    if (!Array.isArray(document_ids) || document_ids.length === 0) {
      return res
        .status(400)
        .json({ message: "Cần chọn ít nhất 1 tài liệu để giữ" });
    }

    const { reservationId } = await Reservation.createReservationWithDetails(
      user_id,
      document_ids,
      note
    );

    res.status(201).json({
      message: "Reservation created successfully",
      reservationId,
    });
  } catch (error) {
    console.error("❌ Error in createReservation:", error);
    res.status(400).json({ message: error.message });
  }
};

// GET /api/reservations/librarian/list?status=on_hold&startDate=2025-10-20
const getReservationsForLibrarian = async (req, res) => {
  try {
    const { status, startDate, endDate, userKeyword, sort, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;

    const result = await Reservation.getReservationsWithDetails(
      null, // ❌ không truyền user_id → xem toàn bộ
      status,
      startDate,
      endDate,
      userKeyword, // 🔹 có thể truyền hoặc không (tìm theo tên / sđt / id)
      sort,
      pageNum,
      limitNum
    );

    res.json(result);
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 🧍‍♀️ User xem danh sách chi tiết giữ (lọc theo trạng thái)
const getUserHoldDetails = async (req, res) => {
  try {
    const user_id = req.user.id; // lấy từ token
    const { status } = req.query;

    const reservations = await Reservation.getUserHoldDetails(user_id, status);
    res.json(reservations);
  } catch (error) {
    console.error("❌ Error in getUserHoldDetails:", error);
    res.status(500).json({ message: error.message });
  }
};
// GET /api/reservations/librarian/user/:user_id
const getReservationsForSpecificUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { status, startDate, endDate, sort } = req.query;

    const reservations = await Reservation.getReservationsWithDetails(
      user_id, // ✅ truyền user_id → chỉ lấy của bạn đọc đó
      status,
      startDate,
      endDate,
      null, // ❌ bỏ userKeyword, vì đã biết user_id
      sort
    );

    res.json(reservations);
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Thủ thư xác nhận phiếu giữ
const confirmReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const reservation = await Reservation.getReservationById(id);
    if (!reservation) return res.status(404).json({ message: "Not found" });

    await Reservation.confirmReservationDetails(id);

    res.json({ message: "Reservation confirmed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Thủ thư cập nhật trạng thái chi tiết giữ theo detail_id cho thủ thư
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
// 📘 Người đọc huỷ 1 chi tiết giữ
const cancelReservationDetailReader = async (req, res) => {
  try {
    const { detail_id } = req.params;
    const user_id = req.user.id;

    // 1️⃣ Lấy thông tin chi tiết giữ để xác thực
    const detail = await Reservation.getReservationDetailBasicById(detail_id);
    if (!detail)
      return res.status(404).json({ message: "Reservation detail not found" });

    // 2️⃣ Kiểm tra quyền sở hữu
    if (detail.user_id !== user_id)
      return res
        .status(403)
        .json({ message: "Unauthorized: This reservation is not yours" });

    // 3️⃣ Kiểm tra trạng thái hợp lệ
    if (!["pending", "on_hold"].includes(detail.detail_status))
      return res.status(400).json({ message: "Cannot cancel at this stage" });

    // 4️⃣ Gọi hàm cập nhật có sẵn
    await Reservation.updateReservationDetailById(detail_id, "cancelled");

    res.json({ message: "Reservation detail cancelled successfully" });
  } catch (error) {
    console.error("❌ Error in cancelReservationDetailReader:", error);
    res.status(500).json({ message: error.message });
  }
};
// 📘 Người đọc huỷ toàn bộ phiếu giữ của mình
const cancelReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    // 1️⃣ Kiểm tra phiếu có thuộc về user hay không
    const [[ticket]] = await pool.query(
      `SELECT id, user_id FROM reservation_tickets WHERE id = ?`,
      [id]
    );
    if (!ticket)
      return res.status(404).json({ message: "Reservation not found" });
    if (ticket.user_id !== user_id)
      return res
        .status(403)
        .json({ message: "Unauthorized: You cannot cancel this reservation" });

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 2️⃣ Hủy tất cả chi tiết giữ + cập nhật record → available
      await conn.query(
        `
        UPDATE reservation_details rd
        JOIN records r ON rd.record_id = r.id
        SET rd.status = 'cancelled', r.status = 'available'
        WHERE rd.reservation_id = ? AND rd.status IN ('pending','on_hold')
        `,
        [id]
      );

      // 3️⃣ Cập nhật phiếu → closed (vì không còn chi tiết pending/on_hold)
      await conn.query(
        `UPDATE reservation_tickets SET status = 'closed' WHERE id = ?`,
        [id]
      );

      await conn.commit();
      res.json({ message: "Reservation cancelled successfully" });
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error("❌ Error in cancelReservation:", error);
    res.status(500).json({ message: error.message });
  }
};

// 📚 Thủ thư hủy phiếu giữ (không cần kiểm tra quyền sở hữu)
const cancelReservationForLibrarian = async (req, res) => {
  try {
    const { id } = req.params; // reservation_id

    // 1️⃣ Kiểm tra phiếu có tồn tại không
    const reservation = await Reservation.getReservationById(id);
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    // 2️⃣ Kiểm tra nếu phiếu đã bị đóng
    if (reservation.ticket_status === "closed") {
      return res.status(400).json({ 
        message: "Reservation is already closed" 
      });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 3️⃣ Hủy tất cả chi tiết giữ + cập nhật record → available
      await conn.query(
        `
        UPDATE reservation_details rd
        JOIN records r ON rd.record_id = r.id
        SET rd.status = 'cancelled', r.status = 'available'
        WHERE rd.reservation_id = ? AND rd.status IN ('pending','on_hold')
        `,
        [id]
      );

      // 4️⃣ Cập nhật phiếu → closed (vì không còn chi tiết pending/on_hold)
      await conn.query(
        `UPDATE reservation_tickets SET status = 'closed' WHERE id = ?`,
        [id]
      );

      await conn.commit();
      res.json({ message: "Reservation cancelled successfully" });
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error("❌ Error in cancelReservationForLibrarian:", error);
    res.status(500).json({ message: error.message });
  }
};

// Cron: auto-cancel pending > 5 days
const autoCancelPendingReservations = async (_req, res) => {
  try {
    const result = await Reservation.autoCancelPendingReservations();
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// 📚 Get all reservation tickets for librarian (no pagination, returns all data)
const getAllReservationsForLibrarian = async (req, res) => {
  try {
    const reservations = await Reservation.getAllReservationsForLibrarian();
    res.json({
      success: true,
      count: reservations.length,
      data: reservations,
    });
  } catch (error) {
    console.error("❌ Error in getAllReservationsForLibrarian:", error);
    res.status(500).json({ message: error.message });
  }
};

// 📚 Get reservation details by ID for librarian
const getReservationDetailsById = async (req, res) => {
  try {
    const { id } = req.params;
    const details = await Reservation.getReservationWithDetailsById(id);
    
    if (!details || details.length === 0) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    res.json({
      success: true,
      data: details,
    });
  } catch (error) {
    console.error("❌ Error in getReservationDetailsById:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createReservation,
  getUserHoldDetails,
  getReservationsForLibrarian,
  getReservationsForSpecificUser,
  confirmReservation,
  updateReservationDetail,
  cancelReservationDetailReader,
  cancelReservation,
  cancelReservationForLibrarian,
  autoCancelPendingReservations,
  getAllReservationsForLibrarian,
  getReservationDetailsById,
};
