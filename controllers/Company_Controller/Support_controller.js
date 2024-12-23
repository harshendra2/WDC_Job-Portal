const Joi=require("joi");
const mongoose=require("mongoose");
const nodemailer=require('nodemailer');
const IssueSchema=require("../../models/Issue_Schema");
const messageModel=require("../../models/messageModel");
const CompanySubscription=require("../../models/Company_SubscriptionSchema");
const company=require('../../models/Onboard_Company_Schema');

const qs=require('qs');
const axios=require('axios');

const IssueValidation=Joi.object({
    Issue_type:Joi.string().min(5).required(),
    description: Joi.string().min(5).required()
  })

  exports.AddNewIssue = async (req, res) => {
    const { id } = req.params;
    const { Issue_type, description } = req.body;

    const { error } = IssueValidation.validate({ Issue_type, description });
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }

    try {
        if (!req.file) {
            return res.status(400).json({ error: "Please upload a file" });
          }
          const possibleSubscriptions = await CompanySubscription.find({
            company_id:id,
            expiresAt: { $gte: new Date() },
            createdDate: { $lte: new Date() },
            support:true
        })
        if (possibleSubscriptions.length ==0) {
          return res.status(400).json({ error: "Please buy a subscription plan." });
      }

        const createdData =new IssueSchema({
            Issue_type,
            description,
            company_id:new mongoose.Types.ObjectId(id),
            file:req.file.path
        });

        const data = await createdData.save();
        return res.status(200).json(data);

    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
};


exports.getAllIssuesClaim=async(req,res)=>{
    const {companyId}=req.params;
    try{
        const data=await IssueSchema.find({company_id:companyId}).sort({createdDate:-1})
        if(data){
            return res.status(200).send(data);
        }else{
            return res.status(400).json({message:"No Issues Claimed"});
        }

    }catch(error){
        return res.status(500).json({error:"Internal Server Error"});
    }
}


exports.SendMailSupport = async (req, res) => {
  const { Message, Subject } =req.body;
  const { cmpId } = req.params;
  const image = req.file;

  try {
      // Fetch company details
      const companyData = await company.findById(cmpId);
      if (!companyData) {
          return res.status(404).json({ success: false, error: "Company not found." });
      }

      // Configure email transporter
      const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
              user: process.env.emailUser,
              pass: process.env.emailPassword,
          },
      });

      // Construct email options
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: companyData.email,
        subject: `${Subject || 'No Subject Provided'}`,
        html: `
            <p>Dear ${companyData.company_name || 'Recipient'},</p>
    
            <p>${Message || 'We wanted to bring this to your attention, but no additional details were provided.'}</p>
    
            <p>Please find the attached screenshot for your reference:</p>
    
            <img src=http://65.20.91.47:4000/${image.path} alt="Screenshot" style="max-width:100%; height:auto; border:1px solid #ddd; padding:5px; margin-top: 15px;">
    
            <p style="margin-top: 20px;">Best regards,</p>
            <p>Your Support Team</p>
    
            <p style="font-size: 12px; color: gray; border-top: 1px solid #ddd; padding-top: 10px;">
                Note: This is an automated email. Please do not reply directly to this message.
            </p>
        `,
    };
      // Send email
      await transporter.sendMail(mailOptions);

      return res.status(200).json({ success: true, message: 'Email sent successfully!' });
  } catch (error) {
      return res.status(500).json({ success: false, error: "Internal server error" });
  }
};


//Chat Session 

exports.getAllMessages=async(Id)=>{
    try{
     const issueId=new mongoose.Types.ObjectId(Id);
     const message=await messageModel.aggregate([{$match:{Issue_id:issueId}}])
        return message || [];

    }catch(error){
        console.log(error);
        throw error;
    }
}

exports.saveNewMessage=async(msg)=>{
    try{
        const newMessage = new messageModel(msg)
        await newMessage.save()
        return newMessage
    }catch(error){
        console.log(error);
        throw error;
    }
}



//tempm

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const code= process.env.CODE
//const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

//const ACCESS_TOKEN_URL = "https://accounts.zoho.com/oauth/v2/token";
const ACCESS_TOKEN_URL ="https://accounts.zoho.in/oauth/v2/token"


exports.CreateAccesstoken=async(req,res)=>{
    try{
        if (!code || !CLIENT_ID || !CLIENT_SECRET) {
            return res.status(400).json({ message: "Missing required parameters." });
          }
      
          // Sending the POST request to get the access token
          const response = await axios.post(
            ACCESS_TOKEN_URL,
            qs.stringify({
              grant_type: "authorization_code",
              client_id: CLIENT_ID,
              client_secret: CLIENT_SECRET,
              redirect_uri: "http://65.20.91.47/candidate-dashboard",
              code: code,
            }),
            {
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
            }
          );
      
            return res.status(200).send({ access_token: response.data});
          
    }catch(error){
        return res.status(500).json({
            message: "An error occurred while fetching the access token.",
            error: error.response ? error.response.data : error.message,
          });
    }
}

exports.GenerateAccesToken=async(req,res)=>{
    try{
        if (!code || !CLIENT_ID || !CLIENT_SECRET) {
            return res.status(400).json({ message: "Missing required parameters." });
          }
      
          // Sending the POST request to get the access token
          const response = await axios.post(
            ACCESS_TOKEN_URL,
            qs.stringify({
              refresh_token:"1000.e5bbc77e1353c1a45766b1208ba081d8.746045b320e38859e6efe52dc32df189",
              grant_type: "refresh_token",
              client_id: CLIENT_ID,
              client_secret: CLIENT_SECRET
            }),
            {
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
            }
          );
      
            return res.status(200).send({ access_token: response.data});
          
    }catch(error){
        return res.status(500).json({error:"Internal server erorr"});
    }
}


const access_token = process.env.ACCESSTOKEN; // Access token from environment variable
exports.GetALLDATAfromZOHO = async (req, res) => {
    try {
      const appOwnerName = "harsendraraj20"; // Replace with your app owner name
      const appName = "di-data-bank"; // Replace with your app name
      const reportName = "Onboard_Candidate_Report"; // Replace with your report name
  

      const url = `https://creator.zoho.in/api/v2/${appOwnerName}/${appName}/report/${reportName}`; 
        // Send the GET request to Zoho API
      const response = await axios.get(url, {
        headers: {
          Authorization: `Zoho-oauthtoken${access_token}`
        },
      });
  
      // Return the API response
      return res.status(200).json(response);
    } catch (error) {
      console.log(error)
      return res.status(500).json({ error: "Internal server error" });
    }
  };