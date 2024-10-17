const Joi = require("joi");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const { email } = require('../../config/emailConfig');
const candidate = require("../../models/Onboard_Candidate_Schema");
const basic_details = require("../../models/Basic_details_CandidateSchema");
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
