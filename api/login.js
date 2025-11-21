// api/login.js

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { query } = require("./_utils/db"); // pool から query に変更
const SECRET_KEY = process.env.JWT_SECRET;

module.exports = async (req, res) => {
  // Vercelでは不要だが、フロントエンドの互換性のため残す
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { studentId, password } = req.body;

  if (!studentId || !password) {
    return res.status(400).json({ error: "学籍番号とパスワードは必須です" });
  }

  try {
    // 修正: studentId -> studentid (DBカラム名に合わせる)
    const result = await query(
      `SELECT * FROM users WHERE studentid = $1`,
      [studentId]
    );

    if (result.rows.length === 0) { // rowCount から rows.length に修正 (より汎用的な書き方)
      return res.status(401).json({ error: "学籍番号またはパスワードが違います" }); // ユーザーが見つからない場合、認証失敗と同じエラーを返すのがベストプラクティス
    }

    const user = result.rows[0];

    // メール認証チェック (カラム名は小文字の isverified で問題なし)
    if (!user.isverified) {
      return res.status(403).json({ error: "メール認証が完了していません" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "学籍番号またはパスワードが違います" }); // パスワード間違いも認証失敗と同じエラーを返す

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
    res.status(500).json({ error: "サーバーエラー" });
  }
};