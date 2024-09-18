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
  password: Joi.string()
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
  const { email, password, setpassword } = req.body;
  const { error } = OnboardRegistration.validate({
    email,
    setpassword,
    password,
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
