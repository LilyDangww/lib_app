const pool = require("../config/db");

//===========================================================================================
// Thêm sách (chat)
const addDocument = async (docData) => {
  const {
    name,
    publisher_id,
    published_year,
    category_id,
    page_nums,
    description,
  } = docData;

  const [result] = await pool.query(
    `INSERT INTO documents (name, publisher_id, published_year, category_id, page_nums, description) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      name,
      publisher_id ?? null, // cho phép NULL
      published_year ?? null,
      category_id, // bắt buộc, không được NULL
      page_nums ?? null,
      description ?? null,
    ]
  );

  return { id: result.insertId, ...docData };
};
//===========================================================================================
const getDocumentsForReaders = async (
  page,
  limit,
  category_id,
  search,
  sort
) => {
  const offset = (page - 1) * limit;

  // Query tổng số document
  let countQuery = `
    SELECT COUNT(DISTINCT d.id) as total
    FROM documents d
    LEFT JOIN doc_authors da ON d.id = da.doc_id
    LEFT JOIN authors a ON da.author_id = a.id
    WHERE d.is_active = 1
  `;
  if (category_id)
    countQuery += ` AND d.category_id = ${pool.escape(category_id)}`;
  if (search)
    countQuery += ` AND (d.name LIKE ${pool.escape("%" + search + "%")}
                      OR a.name LIKE ${pool.escape("%" + search + "%")})`;

  const [countResult] = await pool.query(countQuery);
  const total = countResult[0].total;
  const totalPages = Math.ceil(total / limit);

  // Query dữ liệu chính
  let query = `
  SELECT d.id, d.name,
         GROUP_CONCAT(DISTINCT a.name SEPARATOR ', ') as authors,
         IFNULL(ROUND(AVG(rv.rating),1),0) as avg_rating,
         COUNT(DISTINCT CASE WHEN r.status = 'available' THEN r.id END) as available_count,
         COUNT(DISTINCT bd.id) as total_borrowed
  FROM documents d
  LEFT JOIN doc_authors da ON d.id = da.doc_id
  LEFT JOIN authors a ON da.author_id = a.id
  LEFT JOIN records r ON d.id = r.doc_id
  LEFT JOIN borrow_details bd ON r.id = bd.record_id
  LEFT JOIN reviews rv ON d.id = rv.doc_id
  WHERE d.is_active = 1
`;

  if (category_id) query += ` AND d.category_id = ${pool.escape(category_id)}`;
  if (search)
    query += ` AND (d.name LIKE ${pool.escape("%" + search + "%")}
              OR a.name LIKE ${pool.escape("%" + search + "%")})`;

  query += ` GROUP BY d.id `;

  // Sắp xếp
  if (sort === "name_asc") query += " ORDER BY d.name ASC";
  else if (sort === "name_desc") query += " ORDER BY d.name DESC";
  else if (sort === "rating_high") query += " ORDER BY avg_rating DESC";
  else if (sort === "rating_low") query += " ORDER BY avg_rating ASC";
  else if (sort === "available_most") query += " ORDER BY available_count DESC";
  else if (sort === "available_least") query += " ORDER BY available_count ASC";
  else if (sort === "most_borrowed") query += " ORDER BY total_borrowed DESC";
  else if (sort === "newest") query += " ORDER BY d.published_year DESC";
  else if (sort === "oldest") query += " ORDER BY d.published_year ASC";
  else query += " ORDER BY d.created_at DESC"; // mặc định

  query += ` LIMIT ${limit} OFFSET ${offset}`;

  const [rows] = await pool.query(query);

  return { page, limit, total, totalPages, data: rows };
};

// Cập nhật thông tin sách
const updateDocument = async (id, docData) => {
  const {
    name,
    publisher_id,
    published_year,
    category_id,
    page_nums,
    description,
  } = docData;

  const [result] = await pool.query(
    `UPDATE documents 
     SET name = ?, 
         publisher_id = ?, 
         published_year = ?, 
         category_id = ?, 
         page_nums = ?, 
         description = ? 
     WHERE id = ?`,
    [
      name,
      publisher_id ?? null,
      published_year ?? null,
      category_id,
      page_nums ?? null,
      description ?? null,
      id,
    ]
  );

  return result.affectedRows > 0;
};

// ❌ Không xóa vật lý — chỉ đánh dấu is_active = 0 nếu không còn record sử dụng
const deleteDocument = async (id) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1️⃣ Kiểm tra xem document này còn record nào hoạt động không
    const [records] = await conn.query(
      `
      SELECT COUNT(*) AS active_count
      FROM records
      WHERE doc_id = ? 
        AND status NOT IN ('lost', 'damaged', 'removed') 
      `,
      [id]
    );

    if (records[0].active_count > 0) {
      throw new Error(
        "Không thể xóa tài liệu: vẫn còn bản ghi đang tồn tại hoặc đang lưu thông."
      );
    }

    // 2️⃣ Đánh dấu tài liệu là không hoạt động (is_active = 0)
    const [result] = await conn.query(
      `
      UPDATE documents
      SET is_active = 0
      WHERE id = ?
      `,
      [id]
    );

    await conn.commit();
    return result.affectedRows > 0;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

// Lấy thông tin chi tiết của một sách
const getDocumentById = async (id) => {
  const query = `
    SELECT d.id, d.name, d.publisher_id, d.published_year, d.category_id, 
           d.page_nums, d.description, d.is_active,
           GROUP_CONCAT(DISTINCT a.name SEPARATOR ', ') as authors,
           IFNULL(ROUND(AVG(rv.rating),1),0) as avg_rating,
           COUNT(DISTINCT CASE WHEN r.status = 'available' THEN r.id END) as available_count
    FROM documents d
    LEFT JOIN doc_authors da ON d.id = da.doc_id
    LEFT JOIN authors a ON da.author_id = a.id
    LEFT JOIN records r ON d.id = r.doc_id
    LEFT JOIN reviews rv ON d.id = rv.doc_id
    WHERE d.id = ?
    GROUP BY d.id
  `;

  const [rows] = await pool.query(query, [id]);

  return rows.length > 0 ? rows[0] : null;
};

//===========================================================================================
// lấy danh sách document cho thủ thư (danh mục đầu sách)
const getDocumentsForLibrarians = async (
  page,
  limit,
  category_id,
  search,
  sort
) => {
  const offset = (page - 1) * limit;
  // Query tổng số document
  let countQuery = `SELECT COUNT(*) as total FROM documents d WHERE d.is_active = 1`;
  if (category_id)
    countQuery += ` AND d.category_id = ${pool.escape(category_id)}`;
  if (search)
    countQuery += ` AND d.name LIKE ${pool.escape("%" + search + "%")}`;
  const [countResult] = await pool.query(countQuery);
  const total = countResult[0].total;
  const totalPages = Math.ceil(total / limit);
  // Query lấy dữ liệu chính
  let query = `
    SELECT d.id, d.name,
           GROUP_CONCAT(DISTINCT a.name SEPARATOR ', ') as authors,
            d.published_year,
            d.page_nums,
            c.name as category,
            d.description,
            SUM(CASE WHEN r.status = 'available' THEN 1 ELSE 0 END) as available_count,
            COUNT(bd.id) as total_borrowed
    FROM documents d
    LEFT JOIN doc_authors da ON d.id = da.doc_id
    LEFT JOIN authors a ON da.author_id = a.id
    LEFT JOIN categories c ON d.category_id = c.id
    LEFT JOIN records r ON d.id = r.doc_id
    LEFT JOIN borrow_details bd ON r.id = bd.record_id
    WHERE d.is_active = 1
  `;
  if (category_id) query += ` AND d.category_id = ${pool.escape(category_id)}`;
  if (search)
    query += ` AND (d.name LIKE ${pool.escape(
      "%" + search + "%"
    )} OR a.name LIKE ${pool.escape("%" + search + "%")})`;
  query += `
    GROUP BY d.id
  `;
  if (sort === "newest") query += " ORDER BY d.published_year DESC";
  else if (sort === "oldest") query += " ORDER BY d.published_year ASC";
  else if (sort === "most_borrowed") query += " ORDER BY total_borrowed DESC";
  else query += " ORDER BY d.created_at DESC";
  query += ` LIMIT ${limit} OFFSET ${offset}`;
  const [rows] = await pool
    .query(query)
    .catch((err) => console.error("SQL Error: ", err));
  return { page, limit, total, totalPages, data: rows };
};
//===========================================================================================

module.exports = {
  addDocument,
  getDocumentsForReaders,
  updateDocument,
  deleteDocument,
  getDocumentById,
  getDocumentsForLibrarians,
};
