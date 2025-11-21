const nodemailer = require("nodemailer");

async function sendVerifyEmail(to, url) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject: "【助け合いの極み】メール認証のお願い",
    html: `
      <h2>メール認証を完了してください</h2>
      <p><a href="${url}">${url}</a></p>
      <p style="font-size:14px;color:#666;">※心当たりがない場合は無視してください</p>
    `,
  });
}

module.exports = { sendVerifyEmail };
