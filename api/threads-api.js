// api/threads.js（完全版）
const { query } = require("./_utils/db");

module.exports = async (req, res) => {
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    // --- GET メソッド ---
    if (req.method === "GET") {
      const result = await query(
        `SELECT *
         FROM threads
         ORDER BY created_at DESC`
      );

      const threads = result.rows.map(thread => ({
        id: thread.id,
        title: thread.title,
        content: thread.content,
        authorId: thread.author_id,
        authorNickname: thread.author_nickname,
        authorDepartment: thread.author_department,   // ← 追加
        authorYear: thread.author_year,               // ← 追加
        tags: thread.tags,
        status: thread.status,
        createdAt: thread.created_at
      }));

      return res.status(200).json(threads);
    }

    // --- POST メソッド ---
    if (req.method === "POST") {
      const { title, content, authorId, tags } = req.body;

      // 入力チェック
      if (!title || !content || !authorId) {
        console.error("Missing fields:", { title, content, authorId });
        return res.status(400).json({
          error: "タイトル、内容、または投稿者情報が不足しています"
        });
      }

      // 投稿者情報を users テーブルから取得
      const userResult = await query(
        `SELECT nickname, department, year
         FROM users WHERE id = $1`,
        [authorId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: "ユーザーが存在しません" });
      }

      const user = userResult.rows[0];

      // スレッド作成
      const result = await query(
        `INSERT INTO threads
         (title, content, author_id, author_nickname, author_department, author_year, tags)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          title,
          content,
          authorId,
          user.nickname,
          user.department,
          user.year,
          tags
        ]
      );

      const newThread = {
        id: result.rows[0].id,
        title: result.rows[0].title,
        content: result.rows[0].content,
        authorId: result.rows[0].author_id,
        authorNickname: result.rows[0].author_nickname,
        authorDepartment: result.rows[0].author_department, // ← 追加
        authorYear: result.rows[0].author_year,             // ← 追加
        tags: result.rows[0].tags,
        status: result.rows[0].status,
        createdAt: result.rows[0].created_at
      };

      return res.status(201).json(newThread);
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("threads error:", err, "Body:", req.body);
    res.status(500).json({ error: "サーバーエラー: スレッド処理に失敗しました" });
  }
};
