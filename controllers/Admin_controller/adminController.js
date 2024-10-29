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
        subject: 'Password Reset OTP',
        text:`Dear User,

You have requested to reset your password. Please use the OTP below to proceed with the reset process:

OTP: ${OTP}

This OTP is valid for the next 10 minutes. If you did not request a password reset, please ignore this email, and no changes will be made to your account.

Thank you`,
      };
  
      await transporter.sendMail(mailOptions);
  
      return res.status(201).json({ message: "Email sent successfully", OTP,email});

  }catch(error){
      return res.status(500).json({error:"Internal Server Error"});
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

    // const newPass = await bcrypt.hash(password, 12);

    validAdmin.password = password;
    await validAdmin.save();

    return res.status(200).json({ status: 200, message: "Password updated successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
