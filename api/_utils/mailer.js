// api/_utils/mailer.js

const nodemailer = require("nodemailer");

// トランスポーターをモジュールロード時に一度だけ作成
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,      // ← Vercelの環境変数名に合わせる
    pass: process.env.SMTP_PASS,      // ← Vercelの環境変数名に合わせる
  },
});

async function sendVerifyEmail(to, url) {
  // fromアドレスを環境変数から取得
  const fromAddress = process.env.SMTP_USER || "tasukeai.verify@gmail.com"; 

  console.log("📧 メール送信開始:", { to, from: fromAddress });

  try {
    const info = await transporter.sendMail({
      from: `"助け合いの極み" <${fromAddress}>`,
      to,
      subject: "【助け合いの極み】メール認証のお願い",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">メール認証を完了してください</h2>
          <p>「助け合いの極み」にご登録いただきありがとうございます。</p>
          <p>以下のリンクをクリックして、メールアドレスの認証を完了してください：</p>
          <p style="margin: 30px 0;">
            <a href="${url}" 
               style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">
              メールアドレスを認証する
            </a>
          </p>
          <p style="font-size: 12px; color: #666;">
            または、以下のURLをコピーしてブラウザに貼り付けてください：<br>
            <span style="word-break: break-all;">${url}</span>
          </p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #999;">
            ※このメールに心当たりがない場合は、無視していただいて構いません。
          </p>
        </div>
      `,
    });

    console.log("✅ メール送信成功:", info.messageId);
    return info;

  } catch (error) {
    console.error("❌ メール送信エラー:", error);
    throw error;
  }
}

module.exports = { sendVerifyEmail };