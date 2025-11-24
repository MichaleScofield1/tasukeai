// api/profile.js

const jwt = require("jsonwebtoken");
const { query } = require("./_utils/db");
const SECRET_KEY = process.env.JWT_SECRET;

module.exports = async (req, res) => {
  // CORSヘッダー
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, PUT, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();

  // JWTトークンの検証
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "認証が必要です" });
  }

  const token = authHeader.split(" ")[1];
  let userId;

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    userId = decoded.userId;
  } catch (err) {
    console.error("JWT検証エラー:", err);
    return res.status(401).json({ error: "無効なトークンです" });
  }

  try {
    // ------------------------------------------------------
    // GET: プロフィール取得
    // ------------------------------------------------------
    if (req.method === "GET") {
      // キャッシュを無効化
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      console.log("📥 プロフィール取得:", userId);

      const result = await query(
        `SELECT userid, studentid, email, nickname, department, year, skills 
         FROM users 
         WHERE userid = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "ユーザーが見つかりません" });
      }

      const user = result.rows[0];

      // skillsを配列に変換
      let skills = [];
      if (user.skills) {
        if (typeof user.skills === 'string') {
          try {
            skills = JSON.parse(user.skills);
          } catch {
            skills = user.skills.split(',').map(s => s.trim()).filter(Boolean);
          }
        } else if (Array.isArray(user.skills)) {
          skills = user.skills;
        }
      }

      return res.status(200).json({
        userid: user.userid,
        studentid: user.studentid,
        email: user.email,
        nickname: user.nickname,
        department: user.department,
        year: user.year,
        skills: skills
      });
    }

    // ------------------------------------------------------
    // PUT: プロフィール更新
    // ------------------------------------------------------
    if (req.method === "PUT") {
      const { nickname, skills, department, year } = req.body;

      console.log("📝 プロフィール更新リクエスト:", { userId, nickname, department, year });

      // ニックネームの必須チェック
      if (!nickname || !nickname.trim()) {
        return res.status(400).json({ error: "ニックネームは必須です" });
      }

      // ★ ニックネームの重複チェック（自分以外）
      const nicknameCheck = await query(
        `SELECT userid, nickname FROM users WHERE nickname = $1 AND userid != $2`,
        [nickname.trim(), userId]
      );

      if (nicknameCheck.rows.length > 0) {
        console.log("❌ ニックネーム重複:", nickname);
        return res.status(409).json({ 
          error: "このニックネームは既に使用されています。別のニックネームを選択してください。" 
        });
      }

      // skillsを配列からJSON文字列に変換
      let skillsData = skills;
      if (Array.isArray(skills)) {
        skillsData = JSON.stringify(skills);
      } else if (typeof skills === 'string') {
        // カンマ区切りの文字列の場合
        const skillsArray = skills.split(',').map(s => s.trim()).filter(Boolean);
        skillsData = JSON.stringify(skillsArray);
      }

      // プロフィール更新
      const result = await query(
        `UPDATE users
         SET nickname = $1,
             skills = $2,
             department = $3,
             year = $4
         WHERE userid = $5
         RETURNING userid, studentid, email, nickname, skills, department, year`,
        [nickname.trim(), skillsData, department || '', year || '', userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "ユーザーが見つかりません" });
      }

      console.log("✅ プロフィール更新成功:", result.rows[0]);

      const updatedUser = result.rows[0];

      // skillsを配列に変換して返す
      let returnSkills = [];
      if (updatedUser.skills) {
        if (typeof updatedUser.skills === 'string') {
          try {
            returnSkills = JSON.parse(updatedUser.skills);
          } catch {
            returnSkills = updatedUser.skills.split(',').map(s => s.trim()).filter(Boolean);
          }
        } else if (Array.isArray(updatedUser.skills)) {
          returnSkills = updatedUser.skills;
        }
      }

      return res.status(200).json({
        userid: updatedUser.userid,
        studentid: updatedUser.studentid,
        email: updatedUser.email,
        nickname: updatedUser.nickname,
        department: updatedUser.department,
        year: updatedUser.year,
        skills: returnSkills
      });
    }

    res.status(405).json({ error: "Method not allowed" });

  } catch (err) {
    console.error("❌ profile error:", err);
    res.status(500).json({ 
      error: "サーバーエラー",
      message: err.message 
    });
  }
};