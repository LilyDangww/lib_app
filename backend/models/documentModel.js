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
  SELECT d.id, d.name, d.image_url, d.cloudinary_id,
         GROUP_CONCAT(DISTINCT a.name SEPARATOR ', ') as authors,
         IFNULL(ROUND(AVG(rv.rating),1),0) as avg_rating,
         COUNT(DISTINCT CASE WHEN r.status = 'available' THEN r.id END) as available_count,
         COUNT(DISTINCT bd.id) as total_borrowed
  FROM documents d
  LEFT JOIN doc_authors da ON d.id = da.doc_id
  LEFT JOIN authors a ON da.author_id = a.id
  LEFT JOIN records r ON d.id = r.doc_id
  LEFT JOIN borrow_details bd ON r.id = bd.record_id
  LEFT JOIN reviews rv ON rv.borrow_detail_id = bd.id
  WHERE d.is_active = 1
`;

  if (category_id) query += ` AND d.category_id = ${pool.escape(category_id)}`;
  if (search)
    query += ` AND (d.name LIKE ${pool.escape("%" + search + "%")}
              OR a.name LIKE ${pool.escape("%" + search + "%")})`;

  query += ` GROUP BY d.id `;

  // Sorting
  if (sort === "name_asc") query += " ORDER BY d.name ASC";
  else if (sort === "name_desc") query += " ORDER BY d.name DESC";
  else if (sort === "rating_high") query += " ORDER BY avg_rating DESC";
  else if (sort === "rating_low") query += " ORDER BY avg_rating ASC";
  else if (sort === "available_most") query += " ORDER BY available_count DESC";
  else if (sort === "available_least") query += " ORDER BY available_count ASC";
  else if (sort === "most_borrowed") query += " ORDER BY total_borrowed DESC";
  else if (sort === "newest") query += " ORDER BY d.published_year DESC";
  else if (sort === "oldest") query += " ORDER BY d.published_year ASC";
  else query += " ORDER BY d.created_at DESC";

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

const deleteDocument = async (id) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

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

// Lấy thông tin chi tiết của một sách (thêm image_url)
const getDocumentById = async (id) => {
  const [[doc]] = await pool.query(
    `
    SELECT 
      d.id, d.name, d.published_year, d.page_nums, d.description, d.is_active,
      d.publisher_id, p.name AS publisher_name,
      d.category_id, c.category_name AS category_name,
      d.image_url, d.cloudinary_id
    FROM documents d
    LEFT JOIN publishers p ON p.id = d.publisher_id
    LEFT JOIN categories c ON c.id = d.category_id
    WHERE d.id = ?
    `,
    [id]
  );
  if (!doc) return null;

  // 2) Tác giả
  const [authors] = await pool.query(
    `
    SELECT a.id, a.name
    FROM doc_authors da
    JOIN authors a ON a.id = da.author_id
    WHERE da.doc_id = ?
    ORDER BY a.name
    `,
    [id]
  );

  // 3) Danh sách bản ghi (records)
  const [records] = await pool.query(
    `
    SELECT r.id, r.barcode, r.status
    FROM records r
    WHERE r.doc_id = ?
    ORDER BY r.id
    `,
    [id]
  );

  // 4) Thống kê số lượng bản ghi
  const [[counts]] = await pool.query(
    `
    SELECT 
      COUNT(*) AS total_count,
      SUM(CASE WHEN r.status = 'available' THEN 1 ELSE 0 END) AS available_count
    FROM records r
    WHERE r.doc_id = ?
    `,
    [id]
  );

  // 5) Thống kê rating (reviews via borrow_details)
  const [[ratingAgg]] = await pool.query(
    `
    SELECT 
      IFNULL(ROUND(AVG(rv.rating), 1), 0) AS avg_rating,
      COUNT(rv.id) AS review_count
    FROM records r
    LEFT JOIN borrow_details bd ON bd.record_id = r.id
    LEFT JOIN reviews rv ON rv.borrow_detail_id = bd.id
    WHERE r.doc_id = ?
    `,
    [id]
  );

  // 6) Danh sách reviews (kèm reviewer và record)
  const [reviews] = await pool.query(
    `
    SELECT 
      rv.id, rv.rating, rv.content, rv.created_at, rv.updated_at,
      rv.borrow_detail_id,
      bd.record_id, r.barcode AS record_barcode,
      b.user_id, u.username AS reviewer_name,
      b.borrow_date, b.due_date, bd.return_date
    FROM reviews rv
    JOIN borrow_details bd ON bd.id = rv.borrow_detail_id
    JOIN records r ON r.id = bd.record_id
    JOIN borrow_tickets b ON b.id = bd.borrow_id
    JOIN users u ON u.id = b.user_id
    WHERE r.doc_id = ?
    ORDER BY rv.created_at DESC
    `,
    [id]
  );

  return {
    id: doc.id,
    name: doc.name,
    image_url: doc.image_url,
    cloudinary_id: doc.cloudinary_id,
    published_year: doc.published_year,
    page_nums: doc.page_nums,
    description: doc.description,
    is_active: !!doc.is_active,
    publisher: doc.publisher_id
      ? { id: doc.publisher_id, name: doc.publisher_name }
      : null,
    category: doc.category_id
      ? { id: doc.category_id, name: doc.category_name }
      : null,
    authors, // [{id, name}]
    stats: {
      total_count: Number(counts?.total_count || 0),
      available_count: Number(counts?.available_count || 0),
      avg_rating: Number(ratingAgg?.avg_rating || 0),
      review_count: Number(ratingAgg?.review_count || 0),
    },
    records, // [{id, barcode, status}]
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      content: r.content,
      created_at: r.created_at,
      updated_at: r.updated_at,
      borrow_detail_id: r.borrow_detail_id,
      record: { id: r.record_id, barcode: r.record_barcode },
      reviewer: { id: r.user_id, username: r.reviewer_name },
      borrow: {
        borrow_date: r.borrow_date,
        due_date: r.due_date,
        return_date: r.return_date,
      },
    })),
  };
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
           d.image_url, d.cloudinary_id,
           GROUP_CONCAT(DISTINCT a.name SEPARATOR ', ') as authors,
            d.published_year,
            d.page_nums,
            c.category_name as category,
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
