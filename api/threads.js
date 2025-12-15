// api/threads.js

const { query } = require("./_utils/db");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    if (req.method === "GET") {
      const result = await query(
        `SELECT * FROM threads ORDER BY created_at DESC`
      );
      
      const threads = result.rows.map(thread => ({
        id: thread.id,
        title: thread.title,
        content: thread.content,
        authorId: thread.author_id,
        authorNickname: thread.author_nickname,
        authorDepartment: thread.author_department || '',
        authorYear: thread.author_year || '',
        authorSkills: Array.isArray(thread.author_skills) ? thread.author_skills : [],
        tags: thread.tags,
        status: thread.status || 'open',
        createdAt: thread.created_at
      }));
      
      return res.status(200).json(threads);
    }

    if (req.method === "POST") {
      const { title, content, authorId, authorNickname, tags } = req.body;

      if (!title || !content || !authorId) {
        return res.status(400).json({ 
          error: "タイトル、内容、または投稿者の情報が不足しています"
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
        `INSERT INTO threads (title, content, author_id, author_nickname, author_department, author_year, author_skills, tags, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [title, content, authorId, nickname, department, year, skills, tags || '', 'open']
      );

      const newThread = {
        id: result.rows[0].id,
        title: result.rows[0].title,
        content: result.rows[0].content,
        authorId: result.rows[0].author_id,
        authorNickname: result.rows[0].author_nickname,
        authorDepartment: result.rows[0].author_department,
        authorYear: result.rows[0].author_year,
        authorSkills: Array.isArray(result.rows[0].author_skills) ? result.rows[0].author_skills : [],
        tags: result.rows[0].tags,
        status: result.rows[0].status,
        createdAt: result.rows[0].created_at
      };

      return res.status(201).json(newThread);
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("threads error:", err);
    res.status(500).json({ 
      error: "サーバーエラー: スレッド処理に失敗",
      message: err.message 
    });
  }
};