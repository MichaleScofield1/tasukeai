// api/replies.js

const { query } = require("./_utils/db"); // pool から query に変更

module.exports = async (req, res) => {
  if (req.method === "OPTIONS") return res.status(200).end();
  
  try {
    // GET（一覧読み込み）
    if (req.method === "GET") {
      const { threadId } = req.query;

      // thread_id -> threadid, created_at -> createdat に修正
        const result = await query(
  `SELECT * FROM replies WHERE thread_id = $1 ORDER BY created_at ASC`, // thread_id, created_at に戻す
  [threadId]
);

      return res.status(200).json(result.rows);
    }

    // POST（返信投稿）
    if (req.method === "POST") {
      const { threadId, authorId, authorNickname, content } = req.body;

      // thread_id -> threadid, author_id -> authorid に修正
      // POST
const result = await query(
  `INSERT INTO replies (thread_id, author_id, author_nickname, content) // thread_id, author_id に戻す
   VALUES ($1,$2,$3,$4) RETURNING *`,
  [threadId, authorId, authorNickname, content]
);

      return res.status(201).json(result.rows[0]); // 201 Created を返すのが適切
    }

    res.status(405).json({ error: "Method not allowed" });

  } catch (err) {
    console.error("replies error:", err);
    res.status(500).json({ error: "Server error" });
  }
};