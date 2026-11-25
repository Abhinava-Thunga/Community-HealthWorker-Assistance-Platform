import transporter from "../config/mail.js";

const sendEmail = async (to, subject, html) => {
  const fromEmail = process.env.EMAIL_USER || "chwaplatform@gmail.com";
  console.log(`[EmailService] Attempting to send email to: ${to} from: ${fromEmail}`);

  // 1. Try Brevo HTTPS REST API (Runs over Port 443 / HTTPS - Bypasses Render free tier SMTP port block)
  if (process.env.BREVO_API_KEY) {
    try {
      console.log("[EmailService] Dispatching via Brevo HTTPS API (Port 443)...");
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          sender: { name: "Community Health Worker Platform", email: fromEmail },
          to: [{ email: to }],
          subject,
          htmlContent: html,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || JSON.stringify(data));
      }
      console.log(`[EmailService] Email delivered successfully via Brevo to ${to} (MessageId: ${data.messageId})`);
      return { messageId: data.messageId };
    } catch (brevoErr) {
      console.error("[EmailService] Brevo API Error:", brevoErr.message);
      // Fall through to other transports
    }
  }

  // 2. Try Resend HTTPS REST API (Runs over Port 443 / HTTPS)
  if (process.env.RESEND_API_KEY) {
    try {
      console.log("[EmailService] Dispatching via Resend HTTPS API (Port 443)...");
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `Community Health Worker Platform <${fromEmail}>`,
          to: [to],
          subject,
          html,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || JSON.stringify(data));
      }
      console.log(`[EmailService] Email delivered successfully via Resend to ${to} (ID: ${data.id})`);
      return { messageId: data.id };
    } catch (resendErr) {
      console.error("[EmailService] Resend API Error:", resendErr.message);
      // Fall through to SMTP transporter
    }
  }

  // 3. Fallback to Nodemailer SMTP (Works on localhost or paid cloud hosting)
  console.log("[EmailService] Using Nodemailer direct SMTP...");
  const info = await transporter.sendMail({
    from: `"Community Health Worker Assistance Platform" <${fromEmail}>`,
    to,
    subject,
    html,
  });
  console.log(`[EmailService] Email delivered successfully to ${to} (MessageId: ${info.messageId})`);
  return info;
};

export default sendEmail;