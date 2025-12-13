// api/register.js

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { query } = require("./_utils/db");
const { sendVerifyEmail } = require("./_utils/mailer");

module.exports = async (req, res) => {
  // CORS設定
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { studentId, email, password, confirmPassword, nickname, department, year, accountType } = req.body;

  console.log("📝 登録リクエスト:", { studentId, email, nickname, department, year, accountType });

  // 必須チェック
  if (!studentId || !email || !password || !confirmPassword) {
    return res.status(400).json({ error: "必須項目が不足しています" });
  }

  // パスワード確認チェック
  if (password !== confirmPassword) {
    return res.status(400).json({ error: "パスワードが一致しません" });
  }

  // パスワードの長さチェック
  if (password.length < 6) {
    return res.status(400).json({ error: "パスワードは6文字以上で入力してください" });
  }

  // メールアドレスのドメインチェック（学生 or 教授）
  const isValidDomain = email.endsWith('@ed.tus.ac.jp') || email.endsWith('@rs.tus.ac.jp');
  if (!isValidDomain) {
    return res.status(400).json({ error: "@ed.tus.ac.jp または @rs.tus.ac.jp のメールアドレスを使用してください" });
  }

  // メールアドレスとstudentIdの整合性チェック
  const emailPrefix = email.split('@')[0];
  if (emailPrefix !== studentId) {
    return res.status(400).json({ error: "メールアドレスの@前の部分とユーザーIDが一致しません" });
  }

  // アカウントタイプの判定（フロントエンドから送られない場合は自動判定）
  const detectedAccountType = email.endsWith('@rs.tus.ac.jp') ? 'professor' : 'student';
  const finalAccountType = accountType || detectedAccountType;

  // 学生の場合は学科・学年必須
  if (finalAccountType === 'student' && (!department || !year)) {
    return res.status(400).json({ error: "学生アカウントには学科と学年が必要です" });
  }

  try {
    // 既存ユーザーチェック（学籍番号、メール、ニックネーム）
    const existingUser = await query(
      `SELECT studentid, email, nickname FROM users 
       WHERE studentid = $1 OR email = $2 OR nickname = $3`,
      [studentId, email, nickname]
    );

    if (existingUser.rows.length > 0) {
      const existing = existingUser.rows[0];
      if (existing.studentid === studentId) {
        return res.status(409).json({ error: "このユーザーIDは既に登録されています" });
      }
      if (existing.email === email) {
        return res.status(409).json({ error: "このメールアドレスは既に登録されています" });
      }
      if (existing.nickname === nickname) {
        return res.status(409).json({ error: "このニックネームは既に使用されています。別のニックネームを選択してください。" });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const userId = crypto.randomUUID();

    // 任意項目は空文字にする（NULLエラー防止）
    const safeNickname = nickname || "";
    const safeDepartment = department || "";
    const safeYear = year || "";

    console.log("💾 データベースに保存:", { userId, studentId, email, accountType: finalAccountType });

    // データベースに保存（accountTypeカラムが存在する場合）
    // もしaccountTypeカラムがない場合は、ALTER TABLEで追加する必要があります
    const result = await query(
      `INSERT INTO users (userid, studentid, email, password, nickname, department, year, accounttype, verificationtoken, isverified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING userid, studentid, email, nickname, accounttype`,
      [userId, studentId, email, hashedPassword, safeNickname, safeDepartment, safeYear, finalAccountType, verificationToken, false]
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
      return res.status(409).json({ error: "このユーザーIDまたはメールアドレスは既に登録されています" });
    }
    
    // accounttypeカラムが存在しない場合のエラー
    if (err.code === '42703') {
      return res.status(500).json({ 
        error: "データベーススキーマエラー",
        message: "accounttypeカラムが存在しません。データベースのマイグレーションが必要です。"
      });
    }
    
    res.status(500).json({ 
      error: "サーバーエラー",
      message: err.message 
    });
  }
};