import transporter from "../config/mail.js";

const sendEmail = async (to, subject, html) => {
  console.log(`[EmailService] Sending email to: ${to} (Subject: "${subject}")`);
  const info = await transporter.sendMail({
    from: `"Community Health Worker Assistance Platform" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
  console.log(`[EmailService] Email delivered successfully to ${to} (MessageId: ${info.messageId})`);
  return info;
};

export default sendEmail;