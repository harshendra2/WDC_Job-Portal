const admin = require("../../models/adminSchema");
const bcrypt = require("bcryptjs");
const Joi = require("joi");
const jwt = require("jsonwebtoken")
const SECRET_KEY = process.env.SECRET_KEY;
const nodemailer = require("nodemailer");

const adminRegisterSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

const ForgotPasswordValidation=Joi.object({
  email:Joi.string().email().required()
})

const forgotPasswordConfirmation=Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  confirmpassword: Joi.string().min(6).required()
    .valid(Joi.ref('password')).messages({ 'any.only': 'Password and confirm password do not match' })
})

//email config
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user:"harsendraraj20@gmail.com",
    pass:'ukiovyhquvazeomy',
  },
});

exports.adminregister = async (req, res) => {
  const { email, password } = req.body;

  const { error } = adminRegisterSchema.validate({ email, password });
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    const existingAdmin = await admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const newAdmin = new admin({
      email,
      password
    });

    const storeData = await newAdmin.save();
    return res.status(201).json({ message: "Admin Registration Successful" });
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};


exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;

  const { error } = adminRegisterSchema.validate({ email, password });
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    const preAdmin = await admin.findOne({ email });
    if (!preAdmin) {
      return res.status(400).json({ error: "This Email Id is not registered in our Database" });
    }
    if (preAdmin.status === true) {
      return res.status(400).json({ error: "Your Account is blocked, please contact Super Admin" });
    }

    const passwordMatch = await bcrypt.compare(password, preAdmin.password);
    if (!passwordMatch) {
      return res.status(400).json({ error: "Invalid password" });
    }

    // Generate token
    preAdmin.OnlineStatus=true;
    const token = await preAdmin.generateAuthtoken();
    return res.status(200).json({ message: "Admin Login Successful", adminToken: token });
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.LogOut = async (req, res) => {
  const { id } = req.params;
  try {
    const existedAdmin = await admin.findById(id);

    if (existedAdmin) {
      existedAdmin.OnlineStatus = false;
      await existedAdmin.save();
      return res.status(200).json({ message: "Status changed successfully" });
    } else {
      return res.status(404).json({ error: "Admin not found" });
    }
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};



exports.forgotPassword=async(req,res)=>{
  const {email}=req.body;

  const { error } = ForgotPasswordValidation.validate({ email});
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  try{

      const existedEmail = await admin.findOne({ email });

      if (!existedEmail) {
        return res.status(400).json({ error: "This email does not exist in our database" });
      }
  
      const generateOTP = () => {
        return Math.floor(100000 + Math.random() * 900000).toString();
      };
  
      const OTP = generateOTP();
  
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Password Reset OTP",
        html: `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <div style="max-width: 600px; margin: auto; padding: 20px; background-color: #f7f8fa; border-radius: 8px; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
        <h2 style="text-align: center; color: #1a73e8;">Password Reset OTP</h2>
        <p style="font-size: 16px; color: #333;">
          Hello,
        </p>
        <p style="font-size: 16px; color: #333;">
          You requested an OTP to reset your password. Please use the code below to proceed with resetting your password:
        </p>
        
        <div style="text-align: center; background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="font-size: 24px; color: #333; margin: 0;"><strong>${OTP}</strong></p>
        </div>
        
        <p style="font-size: 16px; color: #333;">
          This OTP is valid for <strong>10 minutes</strong>. If you did not request this, please ignore this email to keep your account secure.
        </p>
        
        <p style="font-size: 16px; color: #1a73e8; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
          Thank you,<br>
          <strong>The Support Team</strong>
        </p>
      </div>
    </div>
  `,
      };
      const OTPExp_time = new Date(Date.now() + 10 * 60 * 1000); 
      await transporter.sendMail(mailOptions);
      existedEmail.OTP=OTP;
      existedEmail.EXP_OTP_Time=OTPExp_time;
      existedEmail.save()
      return res.status(201).json({ message: "Email sent successfully",email});
  }catch(error){
      return res.status(500).json({error:"Internal Server Error"});
  }
}

exports.VerifyOTP=async(req,res)=>{
  const {OTP,email}=req.body;
  try{
    const verifyOTP=await admin.findOne({email});
    const now = new Date();
    if (now > verifyOTP.EXP_OTP_Time) {
      return res.status(400).json({ error: 'OTP has expired' });
    }
    
    if (OTP != verifyOTP.OTP) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }
    return res.status(200).json({message:"OTP verify successfully"});
  }catch(error){
    console.log(error)
    return res.status(500).json({error:"Internal server error"});
  }
}

exports.NewPassword = async (req, res) => {
  const { email, password, confirmpassword } = req.body;

  const { error } = forgotPasswordConfirmation.validate({ email, password, confirmpassword });
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  try {
    const validAdmin = await admin.findOne({ email });
    if (!validAdmin) {
      return res.status(401).json({ status: 401, message: "Admin does not exist" });
    }

    validAdmin.password = password;
    await validAdmin.save();

    return res.status(200).json({ status: 200, message: "Password updated successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
