import transporter from "../config/mail.js";

const sendEmail = async (to, subject, html) => {
  const fromEmail = process.env.EMAIL_USER || "chwaplatform@gmail.com";
  console.log(`[EmailService] Attempting to send email to: ${to} from: ${fromEmail}`);

  const apiErrors = [];

  // 1. Priority 1: Resend HTTPS REST API (Fastest: Delivers in 1-2s over Port 443 with no IP restrictions)
  if (process.env.RESEND_API_KEY) {
    try {
      console.log("[EmailService] Dispatching via Resend HTTPS API (Port 443)...");
      const resendSender = process.env.RESEND_SENDER_EMAIL || "onboarding@resend.dev";
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `Community Health Worker Platform <${resendSender}>`,
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
      apiErrors.push(`Resend: ${resendErr.message}`);
    }
  }

  // 2. Priority 2: Brevo HTTPS REST API (Runs over Port 443 / HTTPS)
  if (process.env.BREVO_API_KEY) {
    try {
      console.log("[EmailService] Dispatching via Brevo HTTPS API (Port 443)...");
      const brevoSenderEmail = process.env.BREVO_SENDER_EMAIL || fromEmail;
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          sender: { name: "Community Health Worker Platform", email: brevoSenderEmail },
          to: [{ email: to }],
          subject,
          htmlContent: html,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        let msg = data.message || JSON.stringify(data);
        if (msg.toLowerCase().includes("unrecognised ip") || msg.toLowerCase().includes("authorised_ips")) {
          msg = "Brevo IP restriction active. Please disable 'Authorised IPs' in Brevo Security Settings (https://app.brevo.com/security/authorised_ips) so dynamic cloud servers can connect.";
        }
        throw new Error(msg);
      }
      console.log(`[EmailService] Email delivered successfully via Brevo to ${to} (MessageId: ${data.messageId})`);
      return { messageId: data.messageId };
    } catch (brevoErr) {
      console.error("[EmailService] Brevo API Error:", brevoErr.message);
      apiErrors.push(`Brevo: ${brevoErr.message}`);
    }
  }

  // 3. Fallback to Nodemailer direct SMTP (Works on localhost or paid cloud hosting)
  try {
    console.log("[EmailService] Using Nodemailer direct SMTP...");
    const info = await transporter.sendMail({
      from: `"Community Health Worker Assistance Platform" <${fromEmail}>`,
      to,
      subject,
      html,
    });
    console.log(`[EmailService] Email delivered successfully to ${to} (MessageId: ${info.messageId})`);
    return info;
  } catch (smtpErr) {
    if (apiErrors.length > 0) {
      throw new Error(`${apiErrors.join(" | ")}. (Direct SMTP fallback also failed: ${smtpErr.message})`);
    }
    throw smtpErr;
  }
};

export default sendEmail;