// api/_utils/mailer.js (修正後)

const nodemailer = require("nodemailer");

// トランスポーターをモジュールロード時に一度だけ作成（コールドスタート時）
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER, // 環境変数名を見やすいように修正（server.jsで使用していたもの）
    pass: process.env.GMAIL_APP_PASS, // 環境変数名を見やすいように修正
  },
});

async function sendVerifyEmail(to, url) {
  // fromアドレスを環境変数から取得
  const fromAddress = process.env.GMAIL_FROM_ADDRESS || process.env.GMAIL_USER || "tasukeai.verify@gmail.com"; 

  await transporter.sendMail({
    from: `"助け合いの極み" <${fromAddress}>`,
    to,
    subject: "【助け合いの極み】メール認証のお願い",
    html: `
      <h2>メール認証を完了してください</h2>
      <p><a href="${url}">${url}</a></p>
      <p style="font-size:14px;color:#666;">※心当たりがない場合は無視してください</p>
    `,
  });
}

// sendVerifyEmail 関数をエクスポート
module.exports = { sendVerifyEmail };