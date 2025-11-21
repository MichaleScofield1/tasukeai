const pool = require("./_utils/db");

module.exports = async (req, res) => {
  try {
    // GET（一覧読み込み）
    if (req.method === "GET") {
      const { threadId } = req.query;

      const result = await pool.query(
        `SELECT * FROM replies WHERE thread_id = $1 ORDER BY created_at ASC`,
        [threadId]
      );

      return res.status(200).json(result.rows);
    }

    // POST（返信投稿）
    if (req.method === "POST") {
      const { threadId, authorId, authorNickname, content } = req.body;

      const result = await pool.query(
        `INSERT INTO replies (thread_id, author_id, author_nickname, content)
         VALUES ($1,$2,$3,$4)
         RETURNING *`,
        [threadId, authorId, authorNickname, content]
      );

      return res.status(200).json(result.rows[0]);
    }

    res.status(405).json({ error: "Method not allowed" });

  } catch (err) {
    console.error("replies error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
