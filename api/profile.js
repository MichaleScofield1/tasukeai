const pool = require("./_utils/db");

module.exports = async (req, res) => {
  const userId = req.query.id;

  try {
    if (req.method === "GET") {
      const result = await pool.query(
        `SELECT id, studentid, email, nickname, skills, department, year
         FROM users WHERE id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.status(200).json(result.rows[0]);
    }

    if (req.method === "PUT") {
      const { nickname, skills, department, year } = req.body;

      const result = await pool.query(
        `UPDATE users
         SET nickname = $1,
             skills = $2,
             department = $3,
             year = $4
         WHERE id = $5
         RETURNING id, nickname, skills, department, year`,
        [nickname, skills, department, year, userId]
      );

      return res.status(200).json(result.rows[0]);
    }

    res.status(405).json({ error: "Method not allowed" });

  } catch (err) {
    console.error("profile error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
