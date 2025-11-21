const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const pool = require("./_utils/db");
const { sendVerifyEmail } = require("./_utils/mailer");

module.exports = async (req, res) => {
  // CORS設定
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { studentId, email, password, nickname, department, year } = req.body;

  if (!studentId || !email || !password || !nickname) {
    return res.status(400).json({ error: "必須項目が不足しています" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const userId = crypto.randomUUID();

    const client = await pool.connect();
    await client.query(
      `
        INSERT INTO users (studentId, email, password, nickname, department, year, verificationToken, userId)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      `,
      [studentId, email, hashedPassword, nickname, department, year, verificationToken, userId]
    );
    client.release();

    // 認証URL
    const verifyUrl = `https://${req.headers.host}/api/verify-email?token=${verificationToken}`;

    // メール送信（Resend）
    await sendVerifyEmail(email, verifyUrl);

    res.json({ message: "登録成功。メールを確認してください。" });

  } catch (err) {
    console.error("登録エラー:", err);
    res.status(500).json({ error: "サーバーエラー" });
  }
};
