// api/delete-reply.js

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
    // URLパスから replyId を抽出
    // クエリパラメータを除去
    const urlPath = req.url.split('?')[0];
    const urlParts = urlPath.split('/').filter(Boolean);
    const replyId = urlParts[urlParts.length - 1];

    console.log("Deleting reply ID:", replyId);

    if (!replyId || replyId === 'delete-reply' || isNaN(replyId)) {
      return res.status(400).json({ error: "返信IDが指定されていません" });
    }

    // 返信を削除
    const result = await query(
      `DELETE FROM replies WHERE id = $1 RETURNING *`,
      [replyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "返信が見つかりません" });
    }

    console.log("Reply deleted successfully:", result.rows[0]);

    return res.status(200).json({ 
      message: "返信を削除しました",
      deletedReply: {
        id: result.rows[0].id
      }
    });

  } catch (err) {
    console.error("Delete reply error:", err);
    return res.status(500).json({ error: "サーバーエラー: " + err.message });
  }
};