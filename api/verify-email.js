const pool = require("./_utils/db");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const token = req.query.token;
  if (!token) return res.status(400).json({ error: "Token required" });

  try {
    const client = await pool.connect();
    const result = await client.query(
      `UPDATE users SET isVerified = TRUE WHERE verificationToken = $1 RETURNING email`,
      [token]
    );
    client.release();

    if (result.rowCount === 0) {
      return res.status(400).json({ error: "Invalid token" });
    }

    res.send(`
      <h2>メール認証が完了しました！</h2>
      <p>アプリに戻ってログインしてください。</p>
    `);

  } catch (err) {
    console.error("Verify error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
