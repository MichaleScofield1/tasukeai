// api/replies.js

const { query } = require("./_utils/db");

module.exports = async (req, res) => {
  // CORSヘッダー
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    // --- GET メソッド: 特定のスレッドの返信を取得 ---
    if (req.method === "GET") {
      const { threadId } = req.query;

      if (!threadId) {
        return res.status(400).json({ error: "スレッドIDが指定されていません" });
      }

      const result = await query(
        `SELECT * FROM replies WHERE thread_id = $1 ORDER BY created_at ASC`,
        [threadId]
      );

      // キャメルケースに変換
      const replies = result.rows.map(reply => ({
        id: reply.id,
        threadId: reply.thread_id,
        authorId: reply.author_id,
        authorNickname: reply.author_nickname,
        authorDepartment: reply.author_department || '',  // ← 追加
        authorYear: reply.author_year || '',              // ← 追加
        content: reply.content,
        createdAt: reply.created_at
      }));

      return res.status(200).json(replies);
    }

    // --- POST メソッド: 返信を投稿 ---
    if (req.method === "POST") {
      const { threadId, authorId, authorNickname, content } = req.body;

      console.log("Creating reply with data:", { threadId, authorId, authorNickname, content });

      // 必須項目のチェック
      if (!threadId || !authorId || !content) {
        console.error("Missing required fields:", { threadId, authorId, authorNickname, content });
        return res.status(400).json({ 
          error: "必要な情報が不足しています",
          message: "必要な情報が不足しています"
        });
      }

      // ★ usersテーブルから投稿者の完全な情報を取得
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

      console.log("★ Reply user info:", { nickname, department, year });

      // 返信を保存（学科と学年も含める）
      const result = await query(
        `INSERT INTO replies (thread_id, author_id, author_nickname, author_department, author_year, content)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [threadId, authorId, nickname, department, year, content]
      );

      console.log("Reply created successfully:", result.rows[0]);

      // キャメルケースに変換
      const newReply = {
        id: result.rows[0].id,
        threadId: result.rows[0].thread_id,
        authorId: result.rows[0].author_id,
        authorNickname: result.rows[0].author_nickname,
        authorDepartment: result.rows[0].author_department,  // ← 追加
        authorYear: result.rows[0].author_year,              // ← 追加
        content: result.rows[0].content,
        createdAt: result.rows[0].created_at
      };

      return res.status(201).json(newReply);
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("replies error:", err, "Body:", req.body);
    res.status(500).json({ 
      error: "サーバーエラー: 返信処理に失敗しました",
      message: err.message 
    });
  }
};