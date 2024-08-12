const Joi = require("joi");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const { email } = require('../../config/emailConfig');
const candidate = require("../../models/Onboard_Candidate_Schema");
const basic_details = require("../../models/Basic_details_CandidateSchema");
const personal_details = require("../../models/Personal_details_candidateSchema");
const work_details = require("../../models/work_details_candidate");
const education_details = require("../../models/education_details_candidateSchema");

const OnboardRegistration = Joi.object({
  email: Joi.string().email().required(),
  setpassword: Joi.string().min(6).required(),
  confirmpassword: Joi.string()
    .min(6)
    .required()
    .valid(Joi.ref("setpassword"))
    .messages({ "any.only": "Password and confirm password do not match" }),
});

const OnboardLogin = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const ForgotPasswordValidation=Joi.object({
  email:Joi.string().email().required()
})

//email config
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user:email.user,
    pass:email.pass,
  },
}); 

const forgotPasswordConfirmation=Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  confirmpassword: Joi.string().min(6).required()
    .valid(Joi.ref('password')).messages({ 'any.only': 'Password and confirm password do not match' })
})

exports.Registration = async (req, res) => {
  const { email, setpassword, confirmpassword } = req.body;

  const { error } = OnboardRegistration.validate({
    email,
    setpassword,
    confirmpassword,
  });

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  try {
    const existingAdmin = await basic_details.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ error: "Email already registered" });
    }
    const hashedPassword = await bcrypt.hash(setpassword, 12);

    const newCandidate = new basic_details({
      email,
      password: hashedPassword,
    });

    const storeData = await newCandidate.save();
    const NewCandidate = new candidate({ basic_details: storeData._id });
    const savedCandidate = await NewCandidate.save();
    return res.status(201).json({ message: "Registration Successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const { error } = OnboardLogin.validate({
    email,
    password,
  });

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  try {
    const existsCandidate = await basic_details.findOne({ email });
    if (!existsCandidate) {
      return res
        .status(400)
        .json({ error: "this email not exists in our data base" });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      existsCandidate.password
    );
    if (!passwordMatch) {
      return res.status(400).json({ error: "Invalid password" });
    }

    // Generate token
    const token = await existsCandidate.generateAuthtoken();
    return res
      .status(200)
      .json({ message: "Login Successfully", CandidateToken: token });
  } catch (error) {
    return res.status(500).json({ error: "Internal Server error" });
  }
};


exports.forgotPassword=async(req,res)=>{
  const {email}=req.body;

  const { error } = ForgotPasswordValidation.validate({ email});
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  try{

      const existedEmail = await basic_details.findOne({ email });

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
        text: `Your OTP for password reset is: ${OTP}. This OTP is valid for the next 10 minutes. If you did not request this, please ignore this email.`,
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

  if (password !== confirmpassword) {
    return res.status(400).json({ error: "Passwords do not match" });
  }

  try {
    const validCandidate = await basic_details.findOne({ email });
    if (!validCandidate) {
      return res.status(401).json({ message: "User does not exist" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    validCandidate.password = hashedPassword;
    await validCandidate.save();

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
