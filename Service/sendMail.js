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
        html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <div style="max-width: 600px; margin: auto; padding: 20px; background-color: #f9f9f9; border-radius: 8px; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
            <h2 style="text-align: center; color: #3b96e1;">Login Verification</h2>
            <p style="font-size: 16px; color: #333;">Hello,</p>
            <p style="font-size: 16px; color: #333;">
              You requested an OTP to verify your login. Please use the code below to proceed with your login:
            </p>
            
            <div style="text-align: center; background-color: #e8f0fe; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="font-size: 24px; color: #333; margin: 0;"><strong>${OTP}</strong></p>
            </div>
            
            <p style="font-size: 16px; color: #333;">
              This code is valid for <strong>10 minutes</strong>. If you did not request this OTP, please disregard this email to keep your account secure.
            </p>
            
            <p style="font-size: 16px; color: #3b96e1; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
              Thank you,<br>
              <strong>Your Application Team</strong>
            </p>
          </div>
        </div>
      `,
      };
      await transporter.sendMail(mailOptions);
  };


exports.sendMailToCompany=async(email,password,url)=>{
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your Login Credentials",
    html: `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <div style="background-color: #f5f7fa; padding: 20px; border-radius: 10px; max-width: 600px; margin: auto;">
        <h2 style="color: #3b96e1; text-align: center;">Welcome to DI Data Bank</h2>
        <p style="font-size: 16px; color: #333;">Dear User,</p>
        <p style="font-size: 16px; color: #333;">
          We are pleased to provide you with your login credentials for our application. Use the details below to log in and start using our services.
        </p>
        
        <div style="background-color: #e8f0fe; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="font-size: 16px; color: #333; margin: 5px 0;"><strong>Email:</strong> ${email}</p>
          <p style="font-size: 16px; color: #333; margin: 5px 0;"><strong>Password:</strong> ${password}</p>
          <p style="font-size: 16px; color: #333; margin: 5px 0;"><strong>Website URL:</strong> <a href="${url}" style="color: #3b96e1; text-decoration: none;">${url}</a></p>
        </div>
        
        <p style="font-size: 16px; color: #333;">
          After logging in, you can change your password using the "Forgot Password" option available on the login page. Please also complete your profile to access all features of the application.
        </p>
        
        <p style="font-size: 16px; color: #3b96e1; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
          Best regards,<br>
          <strong>DI Data Bank Team</strong>
        </p>
        
        <div style="font-size: 14px; color: #888;">
          <p>Contact Us: <a href="mailto:support@didatabank.com" style="color: #3b96e1;">support@didatabank.com</a></p>
        </div>
      </div>
    </div>
  `,
};

  await transporter.sendMail(mailOptions);
}



exports.sendMailToReg=async(email,OTP)=>{
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "One-Time Password (OTP) for Company Registration",
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <div style="background-color: #f5f7fa; padding: 20px; border-radius: 10px; max-width: 600px; margin: auto;">
          <h2 style="color: #3b96e1; text-align: center;">DI Data Bank</h2>
          <p style="font-size: 16px; color: #333;">Dear Valued User,</p>
          <p style="font-size: 16px; color: #333;">Thank you for registering your company with <strong>DI Data Bank</strong>. To complete your registration, please use the following One-Time Password (OTP):</p>
          
          <div style="text-align: center; margin: 20px 0;">
            <span style="display: inline-block; background-color: #3b96e1; color: #fff; padding: 10px 20px; border-radius: 5px; font-size: 24px; font-weight: bold;">${OTP}</span>
          </div>
          
          <p style="font-size: 16px; color: #333;">Please note that this OTP is valid for a limited time and should <strong>not be shared</strong> with anyone.</p>
          <p style="font-size: 16px; color: #333;">If you did not initiate this request, please disregard this email.</p>
          
          <p style="font-size: 16px; color: #3b96e1; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
            Best regards,<br>
            <strong>The DI Data Bank Team</strong>
          </p>
          <div style="font-size: 14px; color: #888;">
            <p>Email: <a href="mailto:${email}" style="color: #3b96e1;">${email}</a></p>
            <p>Contact Us: <a href="mailto:support@didatabank.com" style="color: #3b96e1;">support@didatabank.com</a></p>
          </div>
        </div>
      </div>
    `,
};

  await transporter.sendMail(mailOptions);
}


// Send OTP fro Reject Offer letter 
exports.sendMailToRejectOffer = async (email, OTP) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "One-Time Password (OTP) to Confirm Offer Rejection",
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <div style="background-color: #f5f7fa; padding: 20px; border-radius: 10px; max-width: 600px; margin: auto;">
          <h2 style="color: #3b96e1; text-align: center;">DI Data Bank</h2>
          <p style="font-size: 16px; color: #333;">Dear Valued Candidate,</p>
          <p style="font-size: 16px; color: #333;">
            We understand that you are considering rejecting the offer. For security purposes, please confirm your decision by entering the following One-Time Password (OTP) to proceed with rejecting your offer letter.
          </p>
          
          <div style="text-align: center; margin: 20px 0;">
            <span style="display: inline-block; background-color: #3b96e1; color: #fff; padding: 10px 20px; border-radius: 5px; font-size: 24px; font-weight: bold;">${OTP}</span>
          </div>
          
          <p style="font-size: 16px; color: #333;">
            Please note that this OTP is valid for a limited time and should <strong>not be shared</strong> with anyone. Confirming your decision with this OTP will finalize the rejection process.
          </p>
          <p style="font-size: 16px; color: #333;">If you did not intend to reject the offer, please disregard this email.</p>
          
          <p style="font-size: 16px; color: #3b96e1; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
            Best regards,<br>
            <strong>The DI Data Bank Team</strong>
          </p>
          <div style="font-size: 14px; color: #888;">
            <p>Contact Us: <a href="mailto:support@didatabank.com" style="color: #3b96e1;">support@didatabank.com</a></p>
          </div>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

exports.sendMailToCompany = async (email, reason, companyName, candidateName, jobTitle) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Notification: Offer Rejected by ${candidateName}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <div style="background-color: #f5f7fa; padding: 20px; border-radius: 10px; max-width: 600px; margin: auto;">
          <h2 style="color: #3b96e1; text-align: center;">${companyName}</h2>
          <p style="font-size: 16px; color: #333;">Dear ${companyName},</p>
          
          <p style="font-size: 16px; color: #333;">
            We would like to inform you that the candidate, <strong>${candidateName}</strong>, has decided to reject the offer letter for the position of <strong>${jobTitle}</strong>. Below are the details for your reference:
          </p>

          <div style="margin: 20px 0; padding: 15px; background-color: #fff; border-radius: 10px; border: 1px solid #ddd;">
            <p style="font-size: 16px; margin: 5px 0;"><strong>Candidate Name:</strong> ${candidateName}</p>
            <p style="font-size: 16px; margin: 5px 0;"><strong>Job Title:</strong> ${jobTitle}</p>
            <p style="font-size: 16px; margin: 5px 0;"><strong>Rejection Reason:</strong> ${reason}</p>
          </div>

          <p style="font-size: 16px; color: #333;">
            While the candidate has chosen to pursue other opportunities, we appreciate your efforts in offering them a position.
          </p>

          <p style="font-size: 16px; color: #333;">
            If you need further assistance or wish to discuss this matter, please do not hesitate to contact us.
          </p>
          
          <p style="font-size: 16px; color: #3b96e1; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
            Best regards,<br>
            DI Data bank Team<br>
          </p>
        </div>
      </div>
    `,
  };
    await transporter.sendMail(mailOptions);
};
