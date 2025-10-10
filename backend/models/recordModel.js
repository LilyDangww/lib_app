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

// ============ READ ============
// Lấy tất cả bản ghi (có thể filter theo doc_id)
const getRecords = async (doc_id = null) => {
  let query = `
    SELECT r.id, r.doc_id, d.name as document_name, r.barcode,
           r.location_id, r.status, r.condition_note
    FROM records r
    JOIN documents d ON r.doc_id = d.id
    WHERE 1=1
  `;
  const params = [];
  if (doc_id) {
    query += " AND r.doc_id = ?";
    params.push(doc_id);
  }

  const [rows] = await pool.query(query, params);
  return rows;
};

// Lấy chi tiết một bản ghi theo id
const getRecordById = async (id) => {
  const [rows] = await pool.query(
    `SELECT r.*, d.name as document_name
     FROM records r
     JOIN documents d ON r.doc_id = d.id
     WHERE r.id = ?`,
    [id]
  );
  return rows[0];
};

// ============ UPDATE ============
// Cập nhật thông tin bản ghi
const updateRecord = async (id, data) => {
  const { barcode, location_id, status, condition_note } = data;
  await pool.query(
    `UPDATE records
     SET barcode = ?, location_id = ?, status = ?, condition_note = ?
     WHERE id = ?`,
    [barcode, location_id, status, condition_note, id]
  );
  return getRecordById(id);
};

// ============ DELETE ============
// Xoá bản ghi
const deleteRecord = async (id) => {
  await pool.query(`DELETE FROM records WHERE id = ?`, [id]);
  return { message: `Record ${id} deleted` };
};

module.exports = {
  createRecord,
  getRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
};
