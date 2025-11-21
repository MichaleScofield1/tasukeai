const pool = require("./_utils/db");

module.exports = async (req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const token = req.query.token;

  console.log("受け取った token:", token);

  if (!token) {
    return res.status(400).json({ error: "token がありません" });
  }

  try {
    const client = await pool.connect();

    // 該当ユーザーを取得
    const result = await client.query(
      "SELECT * FROM users WHERE verificationtoken = $1",
      [token]
    );

    if (result.rows.length === 0) {
      client.release();
      return res.status(400).json({ error: "トークンが無効です" });
    }

    // 認証済みにする
    await client.query(
      "UPDATE users SET isverified = true, verificationtoken = null WHERE verificationtoken = $1",
      [token]
    );

    client.release();

    return res.json({ message: "メール認証が完了しました。" });

  } catch (err) {
    console.error("認証エラー:", err);
    return res.status(500).json({ error: "サーバーエラー" });
  }
};
