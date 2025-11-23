const pool = require("../config/db");

// ============ CREATE ============
// Thêm một bản ghi mới (một quyển sách cụ thể)
const createRecord = async (
  doc_id,
  barcode,
  location_id,
  status,
  condition_note
) => {
  const [result] = await pool.query(
    `INSERT INTO records (doc_id, barcode, location_id, status, condition_note)
     VALUES (?, ?, ?, ?, ?)`,
    [
      doc_id,
      barcode,
      location_id,
      status || "available",
      condition_note || null,
    ]
  );
  return {
    id: result.insertId,
    doc_id,
    barcode,
    location_id,
    status,
    condition_note,
  };
};

// Thêm nhiều bản ghi cùng lúc (bulk create)
const createRecordsBulk = async (records) => {
  if (!Array.isArray(records) || records.length === 0) {
    throw new Error("Records array is required and must not be empty");
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const insertedRecords = [];
    const errors = [];

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const { doc_id, barcode, location_id, status, condition_note } = record;

      if (!doc_id || !barcode) {
        errors.push({
          index: i,
          record,
          error: "doc_id và barcode là bắt buộc",
        });
        continue;
      }

      try {
        const [result] = await conn.query(
          `INSERT INTO records (doc_id, barcode, location_id, status, condition_note)
           VALUES (?, ?, ?, ?, ?)`,
          [
            doc_id,
            barcode,
            location_id || null,
            status || "available",
            condition_note || null,
          ]
        );

        insertedRecords.push({
          id: result.insertId,
          doc_id,
          barcode,
          location_id,
          status: status || "available",
          condition_note,
        });
      } catch (err) {
        errors.push({
          index: i,
          record,
          error: err.message,
        });
      }
    }

    await conn.commit();
    return {
      success: insertedRecords.length,
      failed: errors.length,
      records: insertedRecords,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

// Lấy tất cả bản ghi (có thể filter theo doc_id và status)
const getRecords = async (filters = {}) => {
  let query = `
    SELECT r.id, r.barcode, 
           r.doc_id AS document_id,
           d.name AS document_name,
           d.image_url AS document_image_url,
           l.location AS location_name,
           r.status, 
           r.condition_note,
           r.created_at, 
           r.updated_at
    FROM records r
    JOIN documents d ON r.doc_id = d.id
    LEFT JOIN locations l ON r.location_id = l.id
    WHERE 1=1
  `;

  const params = [];

  // Lọc theo doc_id
  if (filters.doc_id) {
    query += " AND r.doc_id = ?";
    params.push(filters.doc_id);
  }

  // Lọc theo status
  if (filters.status) {
    query += " AND r.status = ?";
    params.push(filters.status);
  }

  const [rows] = await pool.query(query, params);
  return rows;
};

// Lấy chi tiết một bản ghi theo id
const getRecordById = async (id) => {
  const [rows] = await pool.query(
    `SELECT r.id, r.barcode,
            r.doc_id AS document_id,
            d.name AS document_name,
            d.image_url AS document_image_url,
            l.location AS location_name,
            r.status, 
            r.condition_note,
            r.created_at, 
            r.updated_at
     FROM records r
     JOIN documents d ON r.doc_id = d.id
     LEFT JOIN locations l ON r.location_id = l.id
     WHERE r.id = ?`,
    [id]
  );
  return rows[0];
};

// ============ UPDATE ============
// Cập nhật thông tin bản ghi (chỉ update field có trong data)
const updateRecord = async (id, data) => {
  const fields = [];
  const values = [];

  if (data.barcode !== undefined) {
    fields.push("barcode = ?");
    values.push(data.barcode);
  }
  if (data.location_id !== undefined) {
    fields.push("location_id = ?");
    values.push(data.location_id);
  }
  if (data.status !== undefined) {
    fields.push("status = ?");
    values.push(data.status);
  }
  if (data.condition_note !== undefined) {
    fields.push("condition_note = ?");
    values.push(data.condition_note);
  }

  if (fields.length === 0) {
    throw new Error("No fields to update");
  }

  const query = `
    UPDATE records 
    SET ${fields.join(", ")} 
    WHERE id = ?`;
  values.push(id);

  await pool.query(query, values);

  return getRecordById(id);
};

// 🔄 Xóa bản ghi — chỉ đổi trạng thái, không xóa khỏi database
const deleteRecord = async (id) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1️⃣ Kiểm tra trạng thái bản ghi
    const [[record]] = await conn.query(
      `SELECT status FROM records WHERE id = ?`,
      [id]
    );

    if (!record) {
      throw new Error("Bản ghi không tồn tại");
    }

    if (record.status === "borrowed") {
      throw new Error("Không thể xóa: bản ghi đang được mượn");
    }

    // 2️⃣ Cập nhật trạng thái
    await conn.query(
      `
      UPDATE records
      SET status = 'lost'
      WHERE id = ?
      `,
      [id]
    );

    await conn.commit();
    return { message: `Record ${id} đã được chuyển sang trạng thái 'lost'` };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

module.exports = {
  createRecord,
  createRecordsBulk,
  getRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
};
