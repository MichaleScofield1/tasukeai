// api/register.js

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { query } = require("./_utils/db"); // ← pool から query に変更
const { sendVerifyEmail } = require("./_utils/mailer");

module.exports = async (req, res) => {
  // CORS設定
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { studentId, email, password, nickname, department, year } = req.body;

  console.log("📝 登録リクエスト:", { studentId, email, nickname, department, year });

  // 必須チェック
  if (!studentId || !email || !password) {
    return res.status(400).json({ error: "必須項目が不足しています" });
  }

  // メールアドレスのドメインチェック（@ed.tus.ac.jp）
  if (!email.endsWith('@ed.tus.ac.jp')) {
    return res.status(400).json({ error: "@ed.tus.ac.jp のメールアドレスを使用してください" });
  }

  try {
    // 既存ユーザーチェック
    const existingUser = await query(
      `SELECT * FROM users WHERE studentid = $1 OR email = $2`,
      [studentId, email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: "この学籍番号またはメールアドレスは既に登録されています" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const userId = crypto.randomUUID();

    // 任意項目は空文字にする（NULLエラー防止）
    const safeNickname = nickname || "";
    const safeDepartment = department || "";
    const safeYear = year || "";

    console.log("💾 データベースに保存:", { userId, studentId, email });

    // ★ query関数を使用（pool.connect()ではなく）
    const result = await query(
      `INSERT INTO users (userid, studentid, email, password, nickname, department, year, verificationtoken, isverified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING userid, studentid, email, nickname`,
      [userId, studentId, email, hashedPassword, safeNickname, safeDepartment, safeYear, verificationToken, false]
    );

    console.log("✅ ユーザー作成成功:", result.rows[0]);

    // 認証URL
    const verifyUrl = `https://${req.headers.host}/api/verify-email?token=${verificationToken}`;

    console.log("📧 認証メール送信中...");

    // メール送信
    await sendVerifyEmail(email, verifyUrl);

    console.log("✅ 認証メール送信成功");

    res.json({ 
      message: "登録成功。メールを確認してください。",
      user: result.rows[0]
    });

  } catch (err) {
    console.error("❌ 登録エラー:", err);
    
    // 詳細なエラーメッセージ
    if (err.code === '23505') { // PostgreSQLの一意制約違反
      return res.status(409).json({ error: "この学籍番号またはメールアドレスは既に登録されています" });
    }
    
    res.status(500).json({ 
      error: "サーバーエラー",
      message: err.message 
    });
  }
};