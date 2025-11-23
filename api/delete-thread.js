// api/delete-thread.js

const { query } = require("./_utils/db");

module.exports = async (req, res) => {
  // CORSヘッダー
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // URLパスから threadId を抽出
    // 例: /api/delete-thread/123 → threadId = 123
    const urlParts = req.url.split('/');
    const threadId = urlParts[urlParts.length - 1];

    console.log("Deleting thread ID:", threadId);

    if (!threadId || threadId === 'delete-thread') {
      return res.status(400).json({ error: "スレッドIDが指定されていません" });
    }

    // まず、関連する返信を削除
    await query(`DELETE FROM replies WHERE thread_id = $1`, [threadId]);

    // 次に、スレッド自体を削除
    const result = await query(
      `DELETE FROM threads WHERE id = $1 RETURNING *`,
      [threadId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "スレッドが見つかりません" });
    }

    console.log("Thread deleted successfully:", result.rows[0]);

    return res.status(200).json({ 
      message: "スレッドを削除しました",
      deletedThread: {
        id: result.rows[0].id,
        title: result.rows[0].title
      }
    });

  } catch (err) {
    console.error("Delete thread error:", err);
    return res.status(500).json({ error: "サーバーエラー: " + err.message });
  }
};