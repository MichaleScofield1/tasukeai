// api/verify-email.js

const { query } = require("./_utils/db"); // pool → query に変更

module.exports = async (req, res) => {
  // CORSヘッダー
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const token = req.query.token;
  console.log("📧 受け取ったトークン:", token);

  if (!token) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>エラー - 助け合いの極み</title>
        <style>
          body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background-color: #f9fafb; }
          .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; max-width: 500px; }
          h1 { color: #ef4444; }
          p { color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>❌ エラー</h1>
          <p>認証トークンが見つかりません。</p>
        </div>
      </body>
      </html>
    `);
  }

  try {
    // トークンでユーザーを検索
    const result = await query(
      `SELECT * FROM users WHERE verificationtoken = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      console.error("❌ 無効なトークン");
      return res.status(400).send(`
        <!DOCTYPE html>
        <html lang="ja">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>エラー - 助け合いの極み</title>
          <style>
            body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background-color: #f9fafb; }
            .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; max-width: 500px; }
            h1 { color: #ef4444; }
            p { color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>❌ 認証エラー</h1>
            <p>認証トークンが無効または期限切れです。</p>
            <p>再度登録をお試しください。</p>
          </div>
        </body>
        </html>
      `);
    }

    const user = result.rows[0];

    // 既に認証済みかチェック
    if (user.isverified) {
      console.log("ℹ️ 既に認証済み");
      return res.send(`
        <!DOCTYPE html>
        <html lang="ja">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>認証完了 - 助け合いの極み</title>
          <style>
            body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background-color: #f9fafb; }
            .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; max-width: 500px; }
            h1 { color: #2563eb; }
            p { color: #6b7280; margin: 20px 0; }
            .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: 500; }
          </style>
          <script>
            setTimeout(() => { window.location.href = 'https://tasukeai.vercel.app'; }, 3000);
          </script>
        </head>
        <body>
          <div class="container">
            <h1>✅ 既に認証済みです</h1>
            <p>このアカウントは既にメール認証が完了しています。</p>
            <p>3秒後にログイン画面へリダイレクトします...</p>
            <a href="https://tasukeai.vercel.app" class="button">今すぐログインする</a>
          </div>
        </body>
        </html>
      `);
    }

    // ユーザーを認証済みに更新
    await query(
      `UPDATE users SET isverified = true, verificationtoken = NULL WHERE userid = $1`,
      [user.userid]
    );

    console.log("✅ メール認証成功:", user.email);

    // 成功ページを表示
    return res.send(`
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>認証完了 - 助け合いの極み</title>
        <style>
          body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background-color: #f9fafb; }
          .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; max-width: 500px; }
          h1 { color: #2563eb; }
          p { color: #6b7280; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: 500; }
          .button:hover { background-color: #1d4ed8; }
        </style>
        <script>
          setTimeout(() => { window.location.href = 'https://tasukeai.vercel.app'; }, 3000);
        </script>
      </head>
      <body>
        <div class="container">
          <h1>🎉 メール認証が完了しました！</h1>
          <p>「助け合いの極み」へようこそ！</p>
          <p>3秒後にログイン画面へ自動的に移動します...</p>
          <a href="https://tasukeai.vercel.app" class="button">今すぐログインする</a>
        </div>
      </body>
      </html>
    `);

  } catch (error) {
    console.error("❌ 認証エラー:", error);
    return res.status(500).send(`
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>エラー - 助け合いの極み</title>
        <style>
          body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background-color: #f9fafb; }
          .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; max-width: 500px; }
          h1 { color: #ef4444; }
          p { color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>❌ サーバーエラー</h1>
          <p>メール認証中にエラーが発生しました。</p>
          <p>しばらくしてから再度お試しください。</p>
        </div>
      </body>
      </html>
    `);
  }
};