// api/profile.js

const jwt = require("jsonwebtoken");
const pool = require("./_utils/db");
const SECRET_KEY = process.env.JWT_SECRET;

module.exports = async (req, res) => {
  try {
    // CORS（必要なら追加）
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, PUT, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") return res.status(200).end();

    // ------------------------------------------------------
    // 1. Authorization ヘッダーから JWT を取得
    // ------------------------------------------------------
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.userId;

    // ------------------------------------------------------
    // 2. GET: ログイン中ユーザーの情報を返す
    // ------------------------------------------------------
    if (req.method === "GET") {
      const result = await pool.query(
        `SELECT userid, studentid, email, nickname, skills, department, year
         FROM users WHERE userid = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.status(200).json(result.rows[0]);
    }

    // ------------------------------------------------------
    // 3. PUT: プロフィール更新
    // ------------------------------------------------------
    if (req.method === "PUT") {
      const { nickname, skills, department, year } = req.body;

      const result = await pool.query(
        `UPDATE users
         SET nickname = $1,
             skills = $2,
             department = $3,
             year = $4
         WHERE userid = $5
         RETURNING userid, studentid, email, nickname, skills, department, year`,
        [nickname, skills, department, year, userId]
      );

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
