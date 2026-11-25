import nodemailer from "nodemailer";

console.log("EMAIL_USER =", process.env.EMAIL_USER);
console.log(
  "EMAIL_PASS =",
  process.env.EMAIL_PASS ? "Loaded ✅" : "Missing ❌"
);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  connectionTimeout: 5000, // 5s connection timeout
  greetingTimeout: 5000,   // 5s greeting timeout
  socketTimeout: 5000,     // 5s socket timeout
});

export default transporter;