const pool = require("./_utils/db");

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = req.query.token;
  console.log("受け取った token:", token);

  try {
    const result = await pool.query(
      `UPDATE users
       SET isverified = TRUE, verificationtoken = NULL
       WHERE verificationtoken = $1
       RETURNING id, email`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "トークンが無効です" });
    }

    res.status(200).json({ message: "メールアドレス認証が完了しました！" });

  } catch (error) {
    console.error("認証エラー:", error);
    res.status(500).json({ error: "サーバーエラー" });
  }
};
