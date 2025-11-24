// api/profile.js

const jwt = require("jsonwebtoken");
const pool = require("./_utils/db");
const SECRET_KEY = process.env.JWT_SECRET;

module.exports = async (req, res) => {
  try {
    // CORS設定
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

      console.log("プロフィール更新リクエスト:", {
        userId,
        nickname,
        skills,
        department,
        year
      });

      // ★ ニックネームの重複チェック（自分以外）
      if (nickname) {
        const nicknameCheck = await pool.query(
          `SELECT userid FROM users WHERE nickname = $1 AND userid != $2`,
          [nickname, userId]
        );
        
        if (nicknameCheck.rows.length > 0) {
          return res.status(409).json({ 
            error: "このニックネームは既に使用されています。別のニックネームを選択してください。" 
          });
        }
      }

      // ★ スキルタグの配列処理
      // skillsが配列の場合、PostgreSQL配列形式に変換
      let skillsValue = skills;
      
      if (Array.isArray(skills)) {
        // 配列の場合はそのまま渡す（PostgreSQLが自動的に配列として認識）
        skillsValue = skills;
      } else if (typeof skills === 'string') {
        // 文字列の場合はそのまま使用
        skillsValue = skills;
      } else if (skills === null || skills === undefined) {
        // nullまたはundefinedの場合は空配列
        skillsValue = [];
      }

      console.log("処理後のskills:", skillsValue);

      // データベース更新
      const result = await pool.query(
        `UPDATE users
         SET nickname = $1,
             skills = $2,
             department = $3,
             year = $4
         WHERE userid = $5
         RETURNING userid, studentid, email, nickname, skills, department, year`,
        [nickname, skillsValue, department, year, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      console.log("プロフィール更新成功:", result.rows[0]);
      return res.status(200).json(result.rows[0]);
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("profile error:", err);
    
    // より詳細なエラー情報をログに出力
    if (err.code) {
      console.error("PostgreSQL Error Code:", err.code);
      console.error("PostgreSQL Error Detail:", err.detail);
    }
    
    res.status(500).json({ 
      error: "Server error",
      detail: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};