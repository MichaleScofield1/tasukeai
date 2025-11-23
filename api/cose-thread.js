// api/close-thread.js

const { query } = require("./_utils/db");

module.exports = async (req, res) => {
  // CORSヘッダー
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // URLパスから threadId を抽出
    // 例: /api/close-thread/123 → threadId = 123
    const urlParts = req.url.split('/');
    const threadId = urlParts[urlParts.length - 1];

    console.log("Closing thread ID:", threadId);

    if (!threadId || threadId === 'close-thread') {
      return res.status(400).json({ error: "スレッドIDが指定されていません" });
    }

    // スレッドのステータスを 'closed' に更新
    const result = await query(
      `UPDATE threads SET status = 'closed' WHERE id = $1 RETURNING *`,
      [threadId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "スレッドが見つかりません" });
    }

    console.log("Thread closed successfully:", result.rows[0]);

    // キャメルケースに変換して返す
    const closedThread = {
      id: result.rows[0].id,
      title: result.rows[0].title,
      content: result.rows[0].content,
      authorId: result.rows[0].author_id,
      authorNickname: result.rows[0].author_nickname,
      tags: result.rows[0].tags,
      status: result.rows[0].status,
      createdAt: result.rows[0].created_at
    };

    return res.status(200).json(closedThread);

  } catch (err) {
    console.error("Close thread error:", err);
    return res.status(500).json({ error: "サーバーエラー: " + err.message });
  }
};