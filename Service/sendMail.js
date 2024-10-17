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


exports.sendMailToCompany=async(email,password,url)=>{
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your Login Credentials",
    text: `Dear User,

We are pleased to provide you with your login credentials for our application.

Email: ${email}
Password: ${password}
Website Url: ${url}

Please use these credentials to log in. If you would like to change your password, you can do so by using the "Forgot Password" feature available on the login page Additionally, please complete your profile to access more features of the application.

Thank you for using our services.

Best regards,
DI Data Bank Team`,
};

  await transporter.sendMail(mailOptions);
}