// api/replies.js

const { query } = require("./_utils/db");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    if (req.method === "GET") {
      const { threadId } = req.query;

      if (!threadId) {
        return res.status(400).json({ error: "スレッドIDが指定されていません" });
      }

      const result = await query(
        `SELECT * FROM replies WHERE thread_id = $1 ORDER BY created_at ASC`,
        [threadId]
      );

      const replies = result.rows.map(reply => ({
        id: reply.id,
        threadId: reply.thread_id,
        authorId: reply.author_id,
        authorNickname: reply.author_nickname,
        authorDepartment: reply.author_department || '',
        authorYear: reply.author_year || '',
        authorSkills: Array.isArray(reply.author_skills) ? reply.author_skills : [],
        content: reply.content,
        createdAt: reply.created_at
      }));

      return res.status(200).json(replies);
    }

    if (req.method === "POST") {
      const { threadId, authorId, authorNickname, content } = req.body;

      if (!threadId || !authorId || !content) {
        return res.status(400).json({ 
          error: "必要な情報が不足しています"
        });
      }

      const userResult = await query(
        `SELECT nickname, department, year, skills FROM users WHERE userid = $1`,
        [authorId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: "ユーザーが存在しません" });
      }

      const user = userResult.rows[0];
      const nickname = user.nickname || authorNickname || 'Unknown';
      const department = user.department || '';
      const year = user.year || '';
      const skills = Array.isArray(user.skills) ? user.skills : [];

      const result = await query(
        `INSERT INTO replies (thread_id, author_id, author_nickname, author_department, author_year, author_skills, content)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [threadId, authorId, nickname, department, year, skills, content]
      );

      const newReply = {
        id: result.rows[0].id,
        threadId: result.rows[0].thread_id,
        authorId: result.rows[0].author_id,
        authorNickname: result.rows[0].author_nickname,
        authorDepartment: result.rows[0].author_department,
        authorYear: result.rows[0].author_year,
        authorSkills: Array.isArray(result.rows[0].author_skills) ? result.rows[0].author_skills : [],
        content: result.rows[0].content,
        createdAt: result.rows[0].created_at
      };

      return res.status(201).json(newReply);
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("replies error:", err);
    res.status(500).json({ 
      error: "サーバーエラー: 返信処理に失敗しました",
      message: err.message 
    });
  }
};