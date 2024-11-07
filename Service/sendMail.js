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
        subject: "Login Verification - OTP Code",
       text:`Hello,

You requested an OTP to verify your login. Please use the code below to proceed with your login:

OTP Code: ${OTP}

This code is valid for 10 minutes. If you did not request this OTP, please disregard this email to keep your account secure.

Thank you`,
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



exports.sendMailToReg=async(email,OTP)=>{
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "One-Time Password (OTP) for Company Registration",
    text: `Dear Valued User,
Thank you for registering your company with DI Data Bank. To complete your registration, please use the following One-Time Password (OTP):

OTP: ${OTP}

Please note that this OTP is valid for a limited time and should not be shared with anyone.

If you did not initiate this request, please disregard this email.

Best regards,  
The DI Data Bank Team

---
Email: ${email}
Contact Us: support@didatabank.com`,
};

  await transporter.sendMail(mailOptions);
}