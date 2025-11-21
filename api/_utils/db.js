// api/_utils/db.js (修正後)

const { Pool } = require("pg");

// Poolインスタンスは一度だけ生成される
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// queryメソッドを直接エクスポートすることで、他のファイルで使いやすくする
module.exports = {
  query: (text, params) => pool.query(text, params),
};