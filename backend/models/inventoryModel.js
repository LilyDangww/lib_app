// models/inventoryReport.js
const db = require("../config/database"); // Giả sử bạn có config kết nối DB

class InventoryReportModel {
  /**
   * Lấy báo cáo kiểm kê sách theo cấu trúc phẳng (dễ xuất Excel)
   * @param {Date} checkDate - Ngày kiểm kê
   * @param {Number} locationId - Lọc theo vị trí (optional)
   * @param {Number} categoryId - Lọc theo danh mục (optional)
   * @returns {Array} Danh sách bản ghi kiểm kê
   */
  static async getInventoryReportFlat(
    checkDate = new Date(),
    locationId = null,
    categoryId = null
  ) {
    let query = `
      SELECT 
        d.id AS doc_id,
        d.name AS document_name,
        c.category_name,
        l.location,
        r.barcode,
        r.status AS record_status,
        r.condition_note,
        CASE 
          WHEN r.status = 'available' THEN 1
          ELSE 0
        END AS available_count,
        CASE 
          WHEN r.status = 'on_loan' THEN 1
          ELSE 0
        END AS on_loan_count,
        CASE 
          WHEN r.status = 'on_hold' THEN 1
          ELSE 0
        END AS on_hold_count,
        CASE 
          WHEN r.status = 'lost' THEN 1
          ELSE 0
        END AS lost_count
      FROM documents d
      INNER JOIN categories c ON d.category_id = c.id
      INNER JOIN records r ON d.id = r.doc_id
      LEFT JOIN locations l ON r.location_id = l.id
      WHERE d.is_active = 1
        AND r.created_at <= ?
    `;

    const params = [checkDate];

    if (locationId) {
      query += ` AND r.location_id = ?`;
      params.push(locationId);
    }

    if (categoryId) {
      query += ` AND d.category_id = ?`;
      params.push(categoryId);
    }

    query += ` ORDER BY d.name, l.location, r.barcode`;

    const [rows] = await db.execute(query, params);
    return rows;
  }

  /**
   * Lấy báo cáo kiểm kê theo cấu trúc phân cấp (như hình bạn mô tả)
   * @param {Date} checkDate - Ngày kiểm kê
   * @param {Number} locationId - Lọc theo vị trí (optional)
   * @param {Number} categoryId - Lọc theo danh mục (optional)
   * @returns {Array} Danh sách theo cấu trúc phân cấp
   */
  static async getInventoryReportHierarchical(
    checkDate = new Date(),
    locationId = null,
    categoryId = null
  ) {
    // Query tổng hợp thông tin
    let query = `
      SELECT 
        d.id AS doc_id,
        d.name AS document_name,
        c.category_name,
        l.id AS location_id,
        l.location,
        r.id AS record_id,
        r.barcode,
        r.status,
        r.condition_note,
        -- Kiểm tra đang được mượn
        CASE WHEN bd.id IS NOT NULL AND bd.return_date IS NULL THEN 1 ELSE 0 END AS is_on_loan,
        -- Thông tin người đang mượn
        u.username AS borrower_name,
        bd.due_date
      FROM documents d
      INNER JOIN categories c ON d.category_id = c.id
      INNER JOIN records r ON d.id = r.doc_id
      LEFT JOIN locations l ON r.location_id = l.id
      LEFT JOIN borrow_details bd ON r.id = bd.record_id AND bd.return_date IS NULL
      LEFT JOIN borrow_tickets bt ON bd.borrow_id = bt.id
      LEFT JOIN users u ON bt.user_id = u.id
      WHERE d.is_active = 1
        AND r.created_at <= ?
    `;

    const params = [checkDate];

    if (locationId) {
      query += ` AND r.location_id = ?`;
      params.push(locationId);
    }

    if (categoryId) {
      query += ` AND d.category_id = ?`;
      params.push(categoryId);
    }

    query += ` ORDER BY d.name, l.location, r.barcode`;

    const [rows] = await db.execute(query, params);

    // Tổ chức dữ liệu theo cấu trúc phân cấp
    const hierarchy = [];
    const docMap = new Map();

    rows.forEach((row) => {
      // Tạo document node nếu chưa có
      if (!docMap.has(row.doc_id)) {
        const docNode = {
          doc_id: row.doc_id,
          document_name: row.document_name,
          category_name: row.category_name,
          locations: [],
          total_records: 0,
          available_count: 0,
          on_loan_count: 0,
          on_hold_count: 0,
          lost_count: 0,
        };
        docMap.set(row.doc_id, docNode);
        hierarchy.push(docNode);
      }

      const docNode = docMap.get(row.doc_id);

      // Tìm hoặc tạo location node
      let locNode = docNode.locations.find(
        (l) => l.location_id === row.location_id
      );
      if (!locNode) {
        locNode = {
          location_id: row.location_id,
          location: row.location || "Chưa xác định",
          records: [],
        };
        docNode.locations.push(locNode);
      }

      // Thêm record vào location
      locNode.records.push({
        record_id: row.record_id,
        barcode: row.barcode,
        status: row.status,
        condition_note: row.condition_note,
        is_on_loan: row.is_on_loan,
        borrower_name: row.borrower_name,
        due_date: row.due_date,
      });

      // Cập nhật thống kê
      docNode.total_records++;
      if (row.status === "available") docNode.available_count++;
      if (row.status === "on_loan") docNode.on_loan_count++;
      if (row.status === "on_hold") docNode.on_hold_count++;
      if (row.status === "lost") docNode.lost_count++;
    });

    return hierarchy;
  }

  /**
   * Lấy báo cáo tổng hợp theo đầu sách
   * @param {Date} checkDate - Ngày kiểm kê
   * @param {Number} categoryId - Lọc theo danh mục (optional)
   * @returns {Array} Thống kê tổng hợp
   */
  static async getInventorySummary(checkDate = new Date(), categoryId = null) {
    let query = `
      SELECT 
        d.id AS doc_id,
        d.name AS document_name,
        c.category_name,
        COUNT(r.id) AS total_records,
        SUM(CASE WHEN r.status = 'available' THEN 1 ELSE 0 END) AS available_count,
        SUM(CASE WHEN r.status = 'on_loan' THEN 1 ELSE 0 END) AS on_loan_count,
        SUM(CASE WHEN r.status = 'on_hold' THEN 1 ELSE 0 END) AS on_hold_count,
        SUM(CASE WHEN r.status = 'lost' THEN 1 ELSE 0 END) AS lost_count
      FROM documents d
      INNER JOIN categories c ON d.category_id = c.id
      INNER JOIN records r ON d.id = r.doc_id
      WHERE d.is_active = 1
        AND r.created_at <= ?
    `;

    const params = [checkDate];

    if (categoryId) {
      query += ` AND d.category_id = ?`;
      params.push(categoryId);
    }

    query += ` GROUP BY d.id, d.name, c.category_name ORDER BY d.name`;

    const [rows] = await db.execute(query, params);
    return rows;
  }
}

module.exports = InventoryReportModel;
