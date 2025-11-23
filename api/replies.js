// api/replies.js

const { query } = require("./_utils/db");

module.exports = async (req, res) => {
  if (req.method === "OPTIONS") return res.status(200).end();
  
  try {
    // GET（一覧読み込み）
    if (req.method === "GET") {
      const { threadId } = req.query;

      const result = await query(
        `SELECT * FROM replies WHERE thread_id = $1 ORDER BY created_at ASC`,
        [threadId]
      );

      return res.status(200).json(result.rows);
    }

    // POST（返信投稿）
if (req.method === "POST") {
  const { threadId, authorId, authorNickname, content } = req.body;

  // ★ デバッグログ追加
  console.log("📥 Received reply data:", { 
    threadId, 
    threadIdType: typeof threadId,
    authorId, 
    authorNickname, 
    content 
  });

  // バリデーション追加
  if (!threadId || !authorId || !authorNickname || !content) {
    console.error("❌ Missing fields");
    return res.status(400).json({ error: "必要な情報が不足しています" });
  }

  // threadIdが数値か確認
  const numericThreadId = parseInt(threadId);
  if (isNaN(numericThreadId)) {
    console.error("❌ Invalid threadId:", threadId);
    return res.status(400).json({ error: "無効なスレッドIDです" });
  }

  const result = await query(
    `INSERT INTO replies (thread_id, author_id, author_nickname, content)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [numericThreadId, authorId, authorNickname, content]
  );

  console.log("✅ Reply created:", result.rows[0]);

  return res.status(201).json(result.rows[0]);
}

    res.status(405).json({ error: "Method not allowed" });

  } catch (err) {
    console.error("replies error:", err);
    res.status(500).json({ error: "Server error" });
  }
};