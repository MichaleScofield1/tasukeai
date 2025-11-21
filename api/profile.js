// api/profile/[id].js または api/profile.js

const pool = require("./_utils/db");

module.exports = async (req, res) => {
  // req.query.id は、URLからユーザーIDを受け取っていることを前提とする
  const userId = req.query.id; 

  try {
    // CORS OPTIONS メソッドの処理 (Vercelでは必須ではないが、フロントの互換性のため残す)
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method === "GET") {
      const result = await pool.query(
        // SELECT 句の全てのカラム名を小文字のDBスキーマに合わせる
        `SELECT id, studentid, email, nickname, skills, department, year, userid
         FROM users WHERE userid = $1`, // <--- userid で検索
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      // 取得したデータ（小文字キー）を返す
      return res.status(200).json(result.rows[0]); 
    }

    if (req.method === "PUT") {
      const { nickname, skills, department, year } = req.body;

      const result = await pool.query(
        `UPDATE users
         SET nickname = $1,
             skills = $2,
             department = $3,
             year = $4
         WHERE userid = $5 
         RETURNING id, nickname, skills, department, year`, // <--- userid で特定
        [nickname, skills, department, year, userId]
      );

      // データの更新がなかった場合 (WHERE句がマッチしなかった場合)
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.status(200).json(result.rows[0]);
    }

    res.status(405).json({ error: "Method not allowed" });

  } catch (err) {
    console.error("profile error:", err);
    res.status(500).json({ error: "Server error" });
  }
};