// api/threads.js

const { query } = require("./_utils/db"); // pool から query に変更

module.exports = async (req, res) => {
  if (req.method === "OPTIONS") return res.status(200).end();
  
  try {
    if (req.method === "GET") {
      const result = await query( // pool.query から query に変更
        // created_at -> createdat に修正
        `SELECT * FROM threads ORDER BY created_at DESC` 
      );
      return res.status(200).json(result.rows);
    }

    if (req.method === "POST") {
      const { title, content, authorId, authorNickname, tags } = req.body;

      // author_id -> authorid に修正
      const result = await query( // pool.query から query に変更
        `INSERT INTO threads (title, content, authorid, author_nickname, tags)
         VALUES ($1,$2,$3,$4,$5)
         RETURNING *`,
        [title, content, authorId, authorNickname, tags]
      );

      return res.status(201).json(result.rows[0]); // 201 Created を返すのが適切
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("threads error:", err);
    res.status(500).json({ error: "Server error" });
  }
};