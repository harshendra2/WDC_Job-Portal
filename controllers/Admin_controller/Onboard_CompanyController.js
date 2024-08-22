const Company = require("../../models/Onboard_Company_Schema");
const Joi = require("joi");
const bcrypt = require("bcryptjs");
const tesseract = require('tesseract.js');

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{3}$/;

const OnboardRegistration = Joi.object({
  email: Joi.string().email().required(),
  mobile: Joi.string().min(10).required(),
  company_name: Joi.string().min(5).required()
});

const OnboardComapanyEdit=Joi.object({
  mobile: Joi.string().min(10).required(),
  company_name: Joi.string().min(5).required(),
  overView: Joi.string().min(5).required(),
  address: Joi.string().min(4).required(),
  industry: Joi.string().required(),
  company_size: Joi.string().required(),
  website_url: Joi.string().min(7).required(),
  location: Joi.string().min(4).required()
})

exports.createOnboardCompany = async (req, res) => {
  const {email, mobile, company_name,overView,industry,company_size,GST,PAN,website_url,location,contact_email,contact_No,headQuater_add} = req.body;

  const { error } = OnboardRegistration.validate({ email, mobile, company_name});
  const panImage = req.files['panImage'] ? req.files['panImage'][0].path : null;
  const gstImage = req.files['gstImage'] ? req.files['gstImage'][0].path : null;
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    const existingCompany = await Company.findOne({ email });
    if (existingCompany) {
      return res.status(400).json({ error: "Email already created" });
    }


    const newCompany = new Company({
      email, mobile, company_name,overView,industry,company_size,GST,PAN,website_url,location,contact_email,contact_No,headQuater_add,GST_image:gstImage,PAN_image:panImage
    });

    const savedCompany = await newCompany.save();

    return res.status(201).json({ message: "Company created Successfully", company: savedCompany });
  } catch (error) {
    console.log(error);
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
    const data=await Company.find({}).sort({ createdAt: -1 });
    if(data){
      return res.status(200).send(data);
    }

  }catch(error){
    return res.status(500).json({error:"Internal Server Error"});
  }
}

exports.editOnboardCompany = async (req, res) => {
  const {mobile, company_name,overView,address,industry,company_size,website_url,location} = req.body;
  const { id } = req.params;

  const { error } = OnboardComapanyEdit.validate({mobile, company_name,overView,address,industry,company_size,website_url,location });
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    const updatedCompany = await Company.findByIdAndUpdate(
      id,
      {mobile, company_name,overView,address,industry,company_size,website_url,location },
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