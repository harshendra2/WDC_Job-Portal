const Company = require("../models/Onboard_Company_Schema");
const Joi = require("joi");
const bcrypt = require("bcryptjs");

const OnboardRegistration = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  mobile: Joi.string().min(10).required(),
  company_name: Joi.string().min(5).required(),
  location: Joi.string().min(4).required(),
  password: Joi.string().min(6).required(),
  confirmPassword: Joi.string().min(6).required()
    .valid(Joi.ref('password')).messages({ 'any.only': 'Password and confirm password do not match' })
});

const OnboardComapanyEdit=Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  mobile: Joi.string().min(10).required(),
  company_name: Joi.string().min(5).required(),
  location: Joi.string().min(4).required()
})

exports.createOnboardCompany = async (req, res) => {
  const { name, email, mobile, company_name, location, password, confirmPassword } = req.body;

  const { error } = OnboardRegistration.validate({ name, email, mobile, company_name, location, password, confirmPassword });
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    const existingCompany = await Company.findOne({ email });
    if (existingCompany) {
      return res.status(400).json({ error: "Email already created" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newCompany = new Company({
      name,
      email,
      mobile,
      company_name,
      location,
      password: hashedPassword
    });

    const savedCompany = await newCompany.save();

    return res.status(201).json({ message: "Company Onboard Registration Successful", company: savedCompany });
  } catch (error) {
    console.error('Error during company registration:', error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};


exports.getSingleCompany=async(req,res)=>{
  const {id}=req.params;
  try{
    const data=await Company.findById({_id:id});
    if(data){
      return res.status(200).send(data)
    }

  }catch(error){
    return res.status(500).json({error:"Internal Server Error"});
  }
}


exports.getAllOnboardCompany=async(req,res)=>{
  try{
    const data=await Company.find({});
    if(data){
      return res.status(200).send(data);
    }

  }catch(error){
    return res.status(500).json({error:"Internal Server Error"});
  }
}

exports.editOnboardCompany = async (req, res) => {
  const { name, email, mobile, company_name, location } = req.body;
  const { id } = req.params;

  const { error } = OnboardComapanyEdit.validate({ name, email, mobile, company_name, location });
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    const updatedCompany = await Company.findByIdAndUpdate(
      id,
      { name, email, mobile, company_name, location },
      { new: true }
    );

    if (!updatedCompany) {
      return res.status(404).json({ error: "Company not found" });
    }

    return res.status(200).json({ message: "Company details updated successfully", updatedCompany });
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};