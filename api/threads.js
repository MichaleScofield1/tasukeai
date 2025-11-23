// api/threads.js (修正版)

const { query } = require("./_utils/db");

module.exports = async (req, res) => {
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
        authorId: thread.author_id,           // author_id → authorId
        authorNickname: thread.author_nickname, // author_nickname → authorNickname
        tags: thread.tags,
        status: thread.status,
        createdAt: thread.created_at          // created_at → createdAt
      }));
      
      return res.status(200).json(threads);
    }

    // --- POST メソッド ---
    if (req.method === "POST") {
      const { title, content, authorId, authorNickname, tags } = req.body;

      // 必須項目のチェック
      if (!title || !content || !authorId || !authorNickname) {
        console.error("Missing required fields for thread creation:", { 
          title, content, authorId, authorNickname 
        });
        return res.status(400).json({ 
          error: "タイトル、内容、または投稿者の情報が不足しています" 
        });
      }

      // DBに保存（スネークケース）
      const result = await query( 
        `INSERT INTO threads (title, content, author_id, author_nickname, tags)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [title, content, authorId, authorNickname, tags]
      );

      // 返却時にキャメルケースに変換
      const newThread = {
        id: result.rows[0].id,
        title: result.rows[0].title,
        content: result.rows[0].content,
        authorId: result.rows[0].author_id,
        authorNickname: result.rows[0].author_nickname,
        tags: result.rows[0].tags,
        status: result.rows[0].status,
        createdAt: result.rows[0].created_at
      };

      return res.status(201).json(newThread); 
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("threads error:", err, "Body:", req.body);
    res.status(500).json({ error: "サーバーエラー: スレッド作成に失敗" });
  }
};