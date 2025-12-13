// api/login.js

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { query } = require("./_utils/db");
const SECRET_KEY = process.env.JWT_SECRET;

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { studentId, password } = req.body;

  if (!studentId || !password) {
    return res.status(400).json({ error: "ユーザーIDとパスワードは必須です" });
  }

  try {
    const result = await query(
      `SELECT * FROM users WHERE studentid = $1`,
      [studentId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "ユーザーIDまたはパスワードが違います" });
    }

    const user = result.rows[0];

    // メール認証チェック
    if (!user.isverified) {
      return res.status(403).json({ error: "メール認証が完了していません。メールボックスを確認してください。" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "ユーザーIDまたはパスワードが違います" });
    }

    const token = jwt.sign({ userId: user.userid }, SECRET_KEY, { expiresIn: "7d" });

    // skillsを配列として返す（DBに保存されている形式に応じて処理）
    let skills = [];
    if (user.skills) {
      // skillsがJSON文字列の場合
      if (typeof user.skills === 'string') {
        try {
          skills = JSON.parse(user.skills);
        } catch {
          skills = user.skills.split(',').map(s => s.trim()).filter(Boolean);
        }
      } 
      // skillsが既に配列の場合
      else if (Array.isArray(user.skills)) {
        skills = user.skills;
      }
    }

    res.json({
      message: "ログイン成功",
      token,
      user: {
        userid: user.userid,
        studentid: user.studentid,
        email: user.email,
        nickname: user.nickname,
        department: user.department || null,  // 教授の場合はnull
        year: user.year || null,              // 教授の場合はnull
        accounttype: user.accounttype || 'student',  // ★ 追加
        skills: skills
      }
    });

  } catch (err) {
    console.error("❌ ログインエラー:", err);
    res.status(500).json({ error: "サーバーエラー" });
  }
};