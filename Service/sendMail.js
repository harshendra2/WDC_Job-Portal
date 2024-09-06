const nodemailer = require('nodemailer');
const { email } = require("../config/emailConfig");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: email.user,
    pass: email.pass,
  },
});

exports.sendEmail = async (email, OTP) => {
  
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to:email,
        subject: "Login OTP",
        text: `Your OTP for Login: ${OTP}. This OTP is valid for the next 10 minutes. If you did not request this, please ignore this email.`,
      };
      await transporter.sendMail(mailOptions);
  };