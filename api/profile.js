// api/profile.js

const jwt = require("jsonwebtoken");
const pool = require("./_utils/db");
const SECRET_KEY = process.env.JWT_SECRET;

module.exports = async (req, res) => {
  try {
    if (req.method === "OPTIONS") return res.status(200).end();

    // ★ 1. Authorization ヘッダーからトークン取得
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1]; // "Bearer xxx"
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.userId;

    // ★ 2. DB からログインユーザー情報を取得
    const result = await pool.query(
      `SELECT userid, studentid, email, nickname, skills, department, year 
       FROM users WHERE userid = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json(result.rows[0]);

  } catch (err) {
    console.error("profile error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
