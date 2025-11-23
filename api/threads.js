// api/threads.js (完全修正版)

const { query } = require("./_utils/db");

module.exports = async (req, res) => {
  // CORSヘッダー
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    // --- GET メソッド ---
    if (req.method === "GET") {
      const result = await query(
        `SELECT * FROM threads ORDER BY created_at DESC` 
      );
      
      // ★★★ 重要：DBのスネークケースをフロントエンドのキャメルケースに変換 ★★★
      const threads = result.rows.map(thread => ({
        id: thread.id,
        title: thread.title,
        content: thread.content,
        authorId: thread.author_id,
        authorNickname: thread.author_nickname,
        authorDepartment: thread.author_department || '',  // ← 追加
        authorYear: thread.author_year || '',              // ← 追加
        tags: thread.tags,
        status: thread.status || 'open',
        createdAt: thread.created_at
      }));
      
      return res.status(200).json(threads);
    }

    // --- POST メソッド ---
if (req.method === "POST") {
  const { title, content, authorId, authorNickname, tags } = req.body;

  console.log("Creating thread with data:", { title, content, authorId, authorNickname, tags });

  // 必須項目のチェック
  if (!title || !content || !authorId) {
    console.error("Missing required fields:", { title, content, authorId, authorNickname });
    return res.status(400).json({ 
      error: "タイトル、内容、または投稿者の情報が不足しています",
      message: "タイトル、内容、または投稿者の情報が不足しています"
    });
  }

  // ★★★ ここが重要：usersテーブルから投稿者の完全な情報を取得 ★★★
  const userResult = await query(
    `SELECT nickname, department, year FROM users WHERE userid = $1`,
    [authorId]
  );

  if (userResult.rows.length === 0) {
    return res.status(404).json({ 
      error: "ユーザーが存在しません",
      message: "ユーザーが存在しません" 
    });
  }

  const user = userResult.rows[0];
  const nickname = user.nickname || authorNickname || 'Unknown';
  const department = user.department || '';
  const year = user.year || '';

  console.log("★ User info:", { nickname, department, year }); // ← このログが重要

  // DBに保存（学科と学年も含める）
  const result = await query( 
    `INSERT INTO threads (title, content, author_id, author_nickname, author_department, author_year, tags, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [title, content, authorId, nickname, department, year, tags || '', 'open']
  );

  console.log("Thread created successfully:", result.rows[0]);

  // 返却時にキャメルケースに変換
  const newThread = {
    id: result.rows[0].id,
    title: result.rows[0].title,
    content: result.rows[0].content,
    authorId: result.rows[0].author_id,
    authorNickname: result.rows[0].author_nickname,
    authorDepartment: result.rows[0].author_department,
    authorYear: result.rows[0].author_year,
    tags: result.rows[0].tags,
    status: result.rows[0].status,
    createdAt: result.rows[0].created_at
  };

  return res.status(201).json(newThread); 
}

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("threads error:", err, "Body:", req.body);
    res.status(500).json({ 
      error: "サーバーエラー: スレッド作成に失敗",
      message: err.message 
    });
  }
};