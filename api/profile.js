const pool = require("../_utils/db");
const jwt = require("jsonwebtoken");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const { id } = req.query;

  try {
    const client = await pool.connect();
    const result = await client.query(
      "SELECT userid, studentid, email, nickname, department, year FROM users WHERE userid=$1",
      [id]
    );
    client.release();

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
