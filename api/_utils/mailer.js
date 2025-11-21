const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendVerifyEmail(to, url) {
  try {
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to,
      subject: "【助け合いの極み】メール認証のお願い",
      html: `
        <h2>メール認証を完了してください</h2>
        <p><a href="${url}">${url}</a></p>
        <p style="font-size:14px;color:#666;">※心当たりがない場合は無視してください</p>
      `
    });
  } catch (err) {
    console.error("メール送信エラー:", err);
    throw err;
  }
}

module.exports = { sendVerifyEmail };
