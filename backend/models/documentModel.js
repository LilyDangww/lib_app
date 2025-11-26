const pool = require("../config/db");
const parse = require("csv-parse").parse;
const xlsx = require("xlsx");

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
    image_url, // mới
    cloudinary_id, // mới
    author_ids, // mới: mảng các author_id
  } = docData;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      `INSERT INTO documents 
       (name, publisher_id, published_year, category_id, page_nums, description, image_url, cloudinary_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        publisher_id ?? null, // cho phép NULL
        published_year ?? null,
        category_id, // bắt buộc, không được NULL
        page_nums ?? null,
        description ?? null,
        image_url ?? null,
        cloudinary_id ?? null,
      ]
    );

    const docId = result.insertId;

    // Thêm authors nếu có
    if (Array.isArray(author_ids) && author_ids.length > 0) {
      const validAuthorIds = author_ids
        .map((id) => Number(id))
        .filter((id) => !Number.isNaN(id) && id > 0);
      
      if (validAuthorIds.length > 0) {
        for (const authorId of validAuthorIds) {
          await conn.query(
            `INSERT IGNORE INTO doc_authors (doc_id, author_id) VALUES (?, ?)`,
            [docId, authorId]
          );
        }
      }
    }

    await conn.commit();
    return { id: docId, ...docData };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
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

  // Đếm tổng: dùng DISTINCT vì có join authors khi search theo tác giả
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

  // Data: tách AVG rating ra subquery theo doc_id để tránh nhân bản bởi authors
  let query = `
    SELECT 
      d.id, d.name, d.image_url, d.cloudinary_id,
      GROUP_CONCAT(DISTINCT a.name SEPARATOR ', ') AS authors,
      IFNULL(rt.avg_rating, 0) AS avg_rating,
      COUNT(DISTINCT CASE WHEN r.status = 'available' THEN r.id END) AS available_count,
      COUNT(DISTINCT bd.id) AS total_borrowed
    FROM documents d
    LEFT JOIN doc_authors da ON d.id = da.doc_id
    LEFT JOIN authors a ON da.author_id = a.id
    LEFT JOIN records r ON d.id = r.doc_id
    LEFT JOIN borrow_details bd ON r.id = bd.record_id
    /* subquery rating theo doc_id, không bị ảnh hưởng bởi join authors */
    LEFT JOIN (
      SELECT r2.doc_id, ROUND(AVG(rv2.rating), 1) AS avg_rating
      FROM records r2
      JOIN borrow_details bd2 ON bd2.record_id = r2.id
      JOIN reviews rv2 ON rv2.borrow_detail_id = bd2.id
      GROUP BY r2.doc_id
    ) rt ON rt.doc_id = d.id
    WHERE d.is_active = 1
  `;
  if (category_id) query += ` AND d.category_id = ${pool.escape(category_id)}`;
  if (search)
    query += ` AND (d.name LIKE ${pool.escape("%" + search + "%")}
               OR a.name LIKE ${pool.escape("%" + search + "%")})`;

  query += ` GROUP BY d.id `;

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
    image_url, // có thể undefined (giữ giá trị cũ)
    cloudinary_id, // có thể undefined (giữ giá trị cũ)
    author_ids, // mới: mảng các author_id (undefined = giữ nguyên, [] = xóa hết, [1,2,3] = cập nhật)
  } = docData;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Lấy giá trị hiện tại để tránh ghi null ngoài ý muốn
    const [[existing]] = await conn.query(
      `SELECT image_url, cloudinary_id FROM documents WHERE id = ?`,
      [id]
    );
    if (!existing) {
      await conn.rollback();
      return false;
    }

    const finalImageUrl =
      image_url !== undefined ? image_url : existing.image_url;
    const finalCloudinaryId =
      cloudinary_id !== undefined ? cloudinary_id : existing.cloudinary_id;

    const [result] = await conn.query(
      `UPDATE documents 
       SET name = ?, 
           publisher_id = ?, 
           published_year = ?, 
           category_id = ?, 
           page_nums = ?, 
           description = ?,
           image_url = ?,
           cloudinary_id = ?
       WHERE id = ?`,
      [
        name,
        publisher_id ?? null,
        published_year ?? null,
        category_id,
        page_nums ?? null,
        description ?? null,
        finalImageUrl ?? null,
        finalCloudinaryId ?? null,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      await conn.rollback();
      return false;
    }

    // Cập nhật authors nếu author_ids được cung cấp
    if (author_ids !== undefined) {
      // Xóa tất cả authors hiện tại
      await conn.query(`DELETE FROM doc_authors WHERE doc_id = ?`, [id]);

      // Thêm authors mới nếu có
      if (Array.isArray(author_ids) && author_ids.length > 0) {
        const validAuthorIds = author_ids
          .map((id) => Number(id))
          .filter((id) => !Number.isNaN(id) && id > 0);
        
        if (validAuthorIds.length > 0) {
          for (const authorId of validAuthorIds) {
            await conn.query(
              `INSERT IGNORE INTO doc_authors (doc_id, author_id) VALUES (?, ?)`,
              [id, authorId]
            );
          }
        }
      }
    }

    await conn.commit();
    return true;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
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

const getCategories = async () => {
  const [rows] = await pool.query(
    `
    SELECT id, category_name
    FROM categories
    ORDER BY category_name ASC
    `
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.category_name,
  }));
};

const getPublishers = async () => {
  const [rows] = await pool.query(
    `
    SELECT id, name
    FROM publishers
    ORDER BY name ASC
    `
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
  }));
};

const getAuthors = async () => {
  const [rows] = await pool.query(
    `
    SELECT id, name
    FROM authors
    ORDER BY name ASC
    `
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
  }));
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
    WHERE r.doc_id = ? AND r.status NOT IN ('lost','damaged','removed')
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

  // Đếm tổng: dùng DISTINCT + join authors để khớp filter search theo tác giả
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

  // Data: COUNT DISTINCT để tránh nhân bản bởi join
  let query = `
    SELECT d.id,
           d.name,
           d.image_url,
           d.cloudinary_id,
           GROUP_CONCAT(DISTINCT a.name SEPARATOR ', ') AS authors,
           d.published_year,
           d.page_nums,
           d.category_id,
           c.category_name AS category,
           d.description,
           COUNT(DISTINCT r.id) AS total_records,
           COUNT(DISTINCT CASE WHEN r.status = 'available' THEN r.id END) AS available_count,
           COUNT(DISTINCT bd.id) AS total_borrowed
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
    query += ` AND (d.name LIKE ${pool.escape("%" + search + "%")}
               OR a.name LIKE ${pool.escape("%" + search + "%")})`;
  query += ` GROUP BY d.id `;
  if (sort === "newest") query += " ORDER BY d.published_year DESC";
  else if (sort === "oldest") query += " ORDER BY d.published_year ASC";
  else if (sort === "most_borrowed") query += " ORDER BY total_borrowed DESC";
  else query += " ORDER BY d.created_at DESC";
  query += ` LIMIT ${limit} OFFSET ${offset}`;

  const [rows] = await pool.query(query);
  return { page, limit, total, totalPages, data: rows };
};

async function getOrCreatePublisher(conn, name) {
  if (!name) return null;
  const [[row]] = await conn.query(`SELECT id FROM publishers WHERE name = ?`, [
    name,
  ]);
  if (row) return row.id;
  const [res] = await conn.query(`INSERT INTO publishers (name) VALUES (?)`, [
    name,
  ]);
  return res.insertId;
}

async function getOrCreateCategory(conn, name) {
  if (!name) return null;
  const [[row]] = await conn.query(
    `SELECT id FROM categories WHERE category_name = ?`,
    [name]
  );
  if (row) return row.id;
  const [res] = await conn.query(
    `INSERT INTO categories (category_name) VALUES (?)`,
    [name]
  );
  return res.insertId;
}

async function getOrCreateAuthor(conn, name) {
  if (!name) return null;
  const [[row]] = await conn.query(`SELECT id FROM authors WHERE name = ?`, [
    name,
  ]);
  if (row) return row.id;
  const [res] = await conn.query(`INSERT INTO authors (name) VALUES (?)`, [
    name,
  ]);
  return res.insertId;
}

// Import tài liệu từ file CSV/XLSX
const importDocumentsFromFile = async (filePath) => {
  const ext = filePath.toLowerCase().endsWith(".xlsx") ? "xlsx" : "csv";
  let rows = [];

  if (ext === "xlsx") {
    const wb = xlsx.readFile(filePath);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    rows = xlsx.utils.sheet_to_json(sheet, { defval: "" });
  } else {
    const content = require("fs").readFileSync(filePath, "utf8");
    rows = await new Promise((resolve, reject) => {
      parse(
        content,
        { columns: true, trim: true, skip_empty_lines: true },
        (err, out) => (err ? reject(err) : resolve(out))
      );
    });
  }

  const conn = await pool.getConnection();
  const summary = { total: rows.length, inserted: 0, skipped: 0, errors: [] };

  try {
    await conn.beginTransaction();

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        const name = r.name?.trim();
        if (!name) {
          summary.skipped++;
          continue;
        }

        // Category (ưu tiên category_id nếu có, else category tên)
        let category_id = r.category_id ? Number(r.category_id) || null : null;
        if (!category_id && r.category) {
          category_id = await getOrCreateCategory(conn, r.category.trim());
        }
        if (!category_id) {
          summary.skipped++;
          continue;
        }

        let publisher_id = null;
        if (r.publisher_id) publisher_id = Number(r.publisher_id) || null;
        else if (r.publisher)
          publisher_id = await getOrCreatePublisher(conn, r.publisher.trim());

        const published_year = r.published_year
          ? Number(r.published_year) || null
          : null;
        const page_nums = r.page_nums ? Number(r.page_nums) || null : null;
        const description = r.description || null;
        const image_url = r.image_url || null;
        const cloudinary_id = r.cloudinary_id || null;

        // Insert document
        const [docRes] = await conn.query(
          `INSERT INTO documents
           (name, publisher_id, published_year, category_id, page_nums, description, image_url, cloudinary_id, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          [
            name,
            publisher_id ?? null,
            published_year ?? null,
            category_id,
            page_nums ?? null,
            description ?? null,
            image_url ?? null,
            cloudinary_id ?? null,
          ]
        );
        const docId = docRes.insertId;

        // Authors
        if (r.authors) {
          const authorNames = r.authors
            .split(/[;,]/)
            .map((x) => x.trim())
            .filter(Boolean);
          for (const aName of authorNames) {
            const aId = await getOrCreateAuthor(conn, aName);
            await conn.query(
              `INSERT IGNORE INTO doc_authors (doc_id, author_id) VALUES (?, ?)`,
              [docId, aId]
            );
          }
        }

        summary.inserted++;
      } catch (e) {
        summary.errors.push({ row: i + 1, message: e.message });
        summary.skipped++;
      }
    }

    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }

  return summary;
};

//===========================================================================================
// Lấy tóm tắt thống kê cho tất cả sách
const getBookSummary = async (page, limit) => {
  const offset = (page - 1) * limit;

  // Đếm tổng số sách
  const [countResult] = await pool.query(
    `
    SELECT COUNT(DISTINCT d.id) as total
    FROM documents d
    WHERE d.is_active = 1
    `
  );
  const total = countResult[0].total;
  const totalPages = Math.ceil(total / limit);

  // Lấy dữ liệu với pagination
  const [rows] = await pool.query(
    `
    SELECT 
      d.id,
      d.name,
      d.category_id,
      c.category_name AS category,
      COUNT(DISTINCT r.id) AS total_records,
      COUNT(DISTINCT CASE WHEN r.status = 'available' THEN r.id END) AS available_count,
      COUNT(DISTINCT CASE WHEN r.status = 'on_loan' THEN r.id END) AS borrowed_count,
      COUNT(DISTINCT CASE WHEN r.status = 'damaged' THEN r.id END) AS damaged_count,
      COUNT(DISTINCT CASE WHEN r.status = 'lost' THEN r.id END) AS lost_count,
      COUNT(DISTINCT CASE WHEN r.status = 'reserved_pending' THEN r.id END) AS reserved_count,
      COUNT(DISTINCT CASE WHEN r.status = 'processing' THEN r.id END) AS processing_count
    FROM documents d
    LEFT JOIN categories c ON d.category_id = c.id
    LEFT JOIN records r ON d.id = r.doc_id
    WHERE d.is_active = 1
    GROUP BY d.id, d.name, d.category_id, c.category_name
    ORDER BY d.id ASC, d.name ASC
    LIMIT ${limit} OFFSET ${offset}
    `
  );

  return {
    page,
    limit,
    total,
    totalPages,
    data: rows.map((row) => ({
      id: Number(row.id),
      name: row.name,
      category_id: row.category_id ? Number(row.category_id) : null,
      category: row.category || null,
      total_records: Number(row.total_records || 0),
      available_count: Number(row.available_count || 0),
      borrowed_count: Number(row.borrowed_count || 0),
      damaged_count: Number(row.damaged_count || 0),
      lost_count: Number(row.lost_count || 0),
      reserved_count: Number(row.reserved_count || 0),
      processing_count: Number(row.processing_count || 0),
    })),
  };
};

module.exports = {
  addDocument,
  getDocumentsForReaders,
  updateDocument,
  deleteDocument,
  getDocumentById,
  getDocumentsForLibrarians,
  importDocumentsFromFile, // added
  getCategories,
  getPublishers,
  getAuthors,
  getBookSummary,
};
