const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("./_utils/db");

const SECRET_KEY = process.env.SECRET_KEY;

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { studentId, password } = req.body;

  if (!studentId || !password) {
    return res.status(400).json({ error: "学籍番号とパスワードは必須です" });
  }

  try {
    const client = await pool.connect();
    const result = await client.query(
      `SELECT * FROM users WHERE studentId = $1`,
      [studentId]
    );
    client.release();

    if (result.rowCount === 0) {
      return res.status(400).json({ error: "ユーザーが見つかりません" });
    }

    const user = result.rows[0];

    // メール認証チェック
    if (!user.isverified) {
      return res.status(403).json({ error: "メール認証が完了していません" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "パスワードが違います" });

    const token = jwt.sign({ userId: user.userid }, SECRET_KEY, { expiresIn: "7d" });

    res.json({
      message: "ログイン成功",
      token,
      user: {
        userId: user.userid,
        nickname: user.nickname,
        department: user.department,
        year: user.year
      }
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
