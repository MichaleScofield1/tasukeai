// api/threads.js (修正版)

const { query } = require("./_utils/db");

module.exports = async (req, res) => {
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    // --- GET メソッド ---
    if (req.method === "GET") {
      const result = await query(
        // created_at はアンダースコアありで修正済みの可能性が高い
        `SELECT * FROM threads ORDER BY created_at DESC` 
      );
      return res.status(200).json(result.rows);
    }

    // --- POST メソッド ---
    if (req.method === "POST") {
      const { title, content, authorId, authorNickname, tags } = req.body;

      // 修正ポイント 1: 必須項目のチェック
      if (!title || !content || !authorId || !authorNickname) {
        // authorId が null の場合はここで 400 エラーを返す
        console.error("Missing required fields for thread creation:", { title, content, authorId, authorNickname });
        return res.status(400).json({ error: "タイトル、内容、または投稿者の情報が不足しています" });
      }

      // 修正ポイント 2: スネークケースの継続使用（DBエラーログに基づき）
      const result = await query( 
        `INSERT INTO threads (title, content, author_id, author_nickname, tags)
         VALUES ($1,$2,$3,$4,$5)
         RETURNING *`,
        [title, content, authorId, authorNickname, tags]
      );

      return res.status(201).json(result.rows[0]); 
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("threads error:", err, "Body:", req.body); // req.body をログに出力してデバッグしやすくする
    res.status(500).json({ error: "サーバーエラー: スレッド作成に失敗" });
  }
};