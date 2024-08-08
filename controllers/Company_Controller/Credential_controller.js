const Joi=require('joi')
const twilio = require('twilio');
const bcrypt = require("bcryptjs");
const company=require('../../models/Onboard_Company_Schema');

const OnboardRegistration = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    confirmpassword: Joi.string().min(6).required()
      .valid(Joi.ref('password')).messages({ 'any.only': 'Password and confirm password do not match' }),
    company_name: Joi.string().min(3).required(),
    mobile: Joi.number().min(10).required(),
    location: Joi.string().required()
  });

  const accountSid=process.env.ACCOUNTSID;
  const authToken=process.env.AUTHTOKEN;
  
  const client = new twilio(accountSid, authToken);

  
const companylogin = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
  });


exports.getOTP = async (req, res) => {
    const { mobile } = req.body;

    const generateOTP = () => {
        return Math.floor(100000 + Math.random() * 900000).toString();
    };

    const OTP = generateOTP();

    try {
        const message = await client.messages.create({
            body: `Your Job portal verification code is ${OTP}`,
            to: mobile,
            from:'+91 7736408809'
        });

        if (message) {
            return res.status(200).json({message:"Message sent successfully",OTP});
        } else {
            return res.status(400).json({ error: "Failed to send message. Please check the mobile number" });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};


exports.Registration = async (req, res) => {
    const { email, password, company_name, mobile, location, confirmpassword } = req.body;
    const { error } = OnboardRegistration.validate({ email, password, confirmpassword, company_name, mobile, location });
    
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 12);

        const existsEmail = await company.findOne({ email });
        if (existsEmail) {
            return res.status(400).json({ error: "This email already exists in our database" });
        }

        const companydata = new company({ email, password: hashedPassword, company_name, mobile, location });
        const data = await companydata.save();
        
        if (data) {
            return res.status(200).json({ message: "Registration Successfully" });
        }

    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
};


exports.Login=async(req,res)=>{
    const {email,password}=req.body;

    const { error } = companylogin.validate({ email, password });
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
    try{

        const preAdmin = await company.findOne({ email });
    if (!preAdmin) {
      return res.status(400).json({ error: "This Email Id is not registered in our Database" });
    }

    const passwordMatch = await bcrypt.compare(password, preAdmin.password);
    if (!passwordMatch) {
      return res.status(400).json({ error: "Invalid password" });
    }

    // Generate token
    const token = await preAdmin.generateAuthtoken();
    return res.status(200).json({ message: "Company Login Successful", companyToken: token });

    }catch(error){
        return res.status(500).json({error:"Internal Server Error"});''
    }
}