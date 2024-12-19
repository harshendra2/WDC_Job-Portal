const Joi = require("joi");
const axios=require('axios');
const fs=require('fs');
const path=require('path')
const qs=require('qs');
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const { email } = require('../../config/emailConfig');
const candidate = require("../../models/Onboard_Candidate_Schema");
const basic_details = require("../../models/Basic_details_CandidateSchema");
const work_details=require("../../models/work_details_candidate");
const education_details=require("../../models/education_details_candidateSchema");
const Counter=require('../../models/CounterSchema');
const Company=require('../../models/Onboard_Company_Schema');

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

async function getNextCustomId() {
  const result = await Counter.findOneAndUpdate(
    {_id:'collection'},
      { $inc: { sequence_value: 1 } },
      { new: true, upsert: true }
  );

  return result.sequence_value;
}

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
    const existedCompany = await Company.findOne({ email });
    if (existedCompany) {
      return res.status(400).json({ error: "This email is already associated with an existing company." });
    }
    
    const customId = await getNextCustomId('customers');
    const hashedPassword = await bcrypt.hash(setpassword, 12);

    const newCandidate = new basic_details({
      custom_id:customId,
      email,
      password: hashedPassword,
    });

    const storeData = await newCandidate.save();
    const NewCandidate = new candidate({ basic_details: storeData._id,custom_id:customId});
    const savedCandidate = await NewCandidate.save();
    return res.status(201).json({ message: "Registration Successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};



exports.CandidateGreenTicks=async(req,res)=>{
  const { user_id,green_id} = req.body;
  const apiUrl = 'https://sandbox.cashfree.com/pg/orders';

  try{
      const companyData=await candidate.findOne({_id:user_id});

      const subscription = await VerifiedBatchPlaneSchema.findOne({ _id:green_id});
      
      if (!subscription) {
          return res.status(404).json({ error: "Subscription plane not found" });
      }
      const orderId = generateOrderId();

      const requestData = {
          customer_details: {
              customer_id: orderId,
              customer_email:companyData.email,
              customer_phone: String(companyData.mobile),
          },
          order_meta: {
              return_url: "https://law-tech.co.in/PaymentSuccessfull?order_id=order_"+orderId
          },
          order_id:"order_"+orderId,
          order_amount:subscription?.price,
          order_currency: "INR",
          order_note: 'Green Tick Batch',
          subscriptionid:green_id
      };

      const requestOptions = {
          method: 'POST',
          headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'x-api-version': '2022-01-01',
              'x-client-id': process.env.CASHFREE_CLIENT_ID,
              'x-client-secret': process.env.CASHFREE_CLIENT_SECRET
          },
          body: JSON.stringify(requestData)
      };

      const response = await fetch(apiUrl, requestOptions);
      const responseData = await response.json();
      if (response.ok) {
          const orderData = {
              order_id: responseData.order_id,
              payment_methods:responseData.order_meta?.payment_methods || 'Not Provided',
              order_status: responseData.order_status,
              order_token: responseData.order_token,
              refundsurl: responseData.refunds ? responseData.refunds.url : 'N/A',
              company_id:company_id,
              green_id: green_id,
              paymentLink:responseData?.payment_link,
              amount:subscription?.price,
              customer_email:companyData.email,
              customer_phone:companyData.mobile,
          };
          res.status(200).json(orderData);
      } else {
          console.error('Error:', responseData);
          res.status(500).json({ error: "Internal server error" });
      }

  }catch(error){
      return res.status(500).json({error:"Internal server error"});
  }
}

exports.GreenTickVerifyPayment = async (req, res) => {
  const { orderId, green_id, company_id,paymentMethod} = req.body;
  //const apiUrl = `https://api.cashfree.com/pg/orders/${orderId}`;
  const apiUrl = `https://sandbox.cashfree.com/pg/orders/${orderId}`
  const headers = {
    'x-client-id': process.env.CASHFREE_CLIENT_ID,
    'x-client-secret': process.env.CASHFREE_CLIENT_SECRET,
    'x-api-version': '2021-05-21',
  };
  try {
      const response = await fetch(apiUrl, {
          method: 'GET',
          headers: headers,
        });
    
        const result = await response.json();
    
          if (result.order_status === 'PAID') {
          const subData = await VerifiedBatchPlaneSchema.findById(green_id);

          if (!subData) {
              return res.status(404).json({ error: "Plan not found" });
          }


          const newExpirationDate = new Date(Date.now() + response?.month * 30 * 24 * 60 * 60 * 1000);

              const verifiedData={
                  batch_name:subData?.batch_name,
                    price:subData?.price,
                    ExpireDate:newExpirationDate,
                    Date:new Date(),
                    orderId:orderId,
                    paymentMethod:paymentMethod
              }

              const updatedWorkDetails = await company.findByIdAndUpdate(
                  company_id,
                  { $push: { verified_batch: verifiedData } }, 
                  { new: true }
                );

                const transaction=new companyTransaction({
                  company_id:company_id,
                  type:'Green Batch plane',
                  Plane_name:subData.batch_name,
                  price:subData.price,
                  payment_method:paymentMethod,
                  transaction_Id:orderId,
                  purchesed_data:new Date(),
                  Expire_date:newExpirationDate
              })
              await transaction.save();

          return res.status(201).json({
              message: "Payment verified and subscription created successfully",
              paymentData: response.data,
              updatedCompanyDetails: updatedWorkDetails
          });
      } else {
          return res.status(400).json({ error: "Payment not verified or payment failed" });
      }
  } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
  }
};


//ZOHO CREATOR

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const code= process.env.CODE

exports.CreatCode=async(req,res)=>{
  const ACCESS_TOKEN_URL ="https://accounts.zoho.in/oauth/v2/auth?"
  try{
    const response = await axios.get(
      ACCESS_TOKEN_URL,
      qs.stringify({
        response_type:"code",
        client_id: CLIENT_ID,
        scope:"ZohoCreator.report.READ ZohoCreator.report.UPDATE",
        redirect_uri: "http://65.20.91.47/candidate-dashboard",
        access_type:"offline"
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );
    console.log(response)

return res.status(200).send({ code : response});

  }catch(error){
    return res.status(500).json({error:"Internal server error"});
  }
}

exports.GetAccessAndRefreshToken=async(req,res)=>{
  const ACCESS_TOKEN_URL ="https://accounts.zoho.in/oauth/v2/token"
  try{
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
    return res.status(500).json({error:"Internal server error"});
  }
}

const GenerateAccesToken=async(req,res)=>{
  const ACCESS_TOKEN_URL ="https://accounts.zoho.in/oauth/v2/token"
  const refreshtoken=process.env.REFRESH_TOKEN
  try{
 const response = await axios.post(
            ACCESS_TOKEN_URL,
            qs.stringify({
              refresh_token:refreshtoken,
              grant_type: "refresh_token",
              client_id: CLIENT_ID,
              client_secret: CLIENT_SECRET
            }),
            {
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
            }
          );
       return response.data?.access_token
     
  }catch(error){
    return res.status(500).json({error:"Internal server error"});
  }
}


const isValidUrl = (url) => {
  try {
      new URL(url);
      return true;
  } catch {
      return false;
  }
};
exports.GetAllDataFromZohoReport = async (req, res) => {
  try {
    const appOwnerName = process.env.APPOWNER_NAME;
    const appName = process.env.APP_NAME;
    const reportName = process.env.REPORT_NAME;
    const access_token = await GenerateAccesToken();

    const limit = 200;
    let from = 0;
    let allData = [];

    while (true) {
      const url = `https://creator.zoho.in/api/v2/${appOwnerName}/${appName}/report/${reportName}?from=${from}&limit=${limit}`;
      const response = await axios.get(url, {
        headers: {
          Authorization: `Zoho-oauthtoken ${access_token}`,
        },
      });

      const data = response?.data?.data || [];
      allData = allData.concat(data);

      if (data.length < limit) break; // Stop if fewer records are returned
      from += limit;
    }


    const basicDetailsDocs = [];
    const workDetailsDocs = [];
    const educationDetailsDocs = [];
    const candidateDocs = [];

    for (const item of allData) {
      const existedData = await basic_details.findOne({ email: item?.Email });
      if (!existedData) {
        const customId = await getNextCustomId("customers");
        const hashedPassword = await bcrypt.hash("Candidate12#", 12);

        const basicDetails = {
          custom_id: customId,
          email: item?.Email,
          mobile: item?.Phone_Number,
          name: item?.Name?.display_value,
          password: hashedPassword,
        };
        basicDetailsDocs.push(basicDetails);

        let resumePath = null;
        if (item?.LinkedIn_Resume || item?.Resume || item?.One_Pager) {
          const resumeUrl = item?.LinkedIn_Resume || item?.Resume || item?.One_Pager;
          if (isValidUrl(`https://creator.zoho.in${resumeUrl}`)) {
            const fileName = `resume_${customId}.pdf`;
            const localFilePath = path.join("Images", fileName);

            try {
              const resumeResponse = await axios.get(`https://creator.zoho.in${resumeUrl}`, {
                headers: {
                  Authorization: `Zoho-oauthtoken ${access_token}`,
                },
                responseType: "stream",
              });

              const fileStream = fs.createWriteStream(localFilePath);

              resumeResponse.data.pipe(fileStream);

              await new Promise((resolve, reject) => {
                fileStream.on("finish", resolve);
                fileStream.on("error", reject);
              });

              resumePath = `/Images/${fileName}`;
            } catch (error) {
              console.error(`Error downloading resume from ${resumeUrl}:`, error.message);
            }
          } else {
            console.warn(`Invalid resume URL: ${resumeUrl}`);
          }
        }

        const workDetails = {
          custom_id: customId,
          work_experienc: item?.Work_Experiance,
          industry: item?.Domain_Industry,
          skill: item?.Skills,
          resume: resumePath,
        };
        workDetailsDocs.push(workDetails);

        const educationDetails = {
          custom_id: customId,
          highest_education: item?.Educational_Backround,
        };
        educationDetailsDocs.push(educationDetails);

        candidateDocs.push({
          basic_details: null,
          work_details: null,
          education_details: null,
          custom_id: customId,
          ImportStatus: true,
          ID: item?.ID,
        });
      }
    }

    const basicDetailsResult = await basic_details.insertMany(basicDetailsDocs);
    const workDetailsResult = await work_details.insertMany(workDetailsDocs);
    const educationDetailsResult = await education_details.insertMany(educationDetailsDocs);

    candidateDocs.forEach((candidate, index) => {
      candidate.basic_details = basicDetailsResult[index]._id;
      candidate.work_details = workDetailsResult[index]._id;
      candidate.education_details = educationDetailsResult[index]._id;
    });

    await candidate.insertMany(candidateDocs);
    return res.status(200).json({ message: "Data imported successfully" });
  } catch (error) {
    console.error("Error importing data:", error);
    return res.status(500).json({ message: "Error importing data", error: error.message });
  }
};
