const Company = require('../../models/Onboard_Company_Schema');
const companySubscription = require('../../models/Company_SubscriptionSchema');
const CompanyJob = require('../../models/JobSchema');
const Joi = require("joi");
const XLSX = require('xlsx');
const axios=require('axios');
const tesseract = require('tesseract.js');
const mongoose=require('mongoose')
const { sendMailToCompanys } = require('../../Service/sendMail');
const bcrypt=require('bcryptjs')

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{3}$/;

const OnboardRegistration = Joi.object({
  email: Joi.string().email().required(),
  mobile: Joi.string().length(10).pattern(/^[0-9]+$/).required(), 
  company_name: Joi.string().min(5).required(),
  industry: Joi.string().min(1),
  company_size: Joi.string(),
  GST: Joi.string().pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}[Z]{1}[A-Z0-9]{1}$/), 
  PAN: Joi.string().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/),
  website_url: Joi.string().uri(),
  location: Joi.string(),
  contact_email: Joi.string().email(),
  contact_No: Joi.string().pattern(/^[0-9]+$/), 
  headQuater_add: Joi.string()
});


const OnboardComapanyEdit=Joi.object({
  email: Joi.string().email().required(),
  mobile: Joi.string().length(10).pattern(/^[0-9]+$/).required(), 
  company_name: Joi.string().min(5).required(),
  industry: Joi.string().min(1),
  company_size: Joi.string(),
  GST: Joi.string().pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}[Z]{1}[A-Z0-9]{1}$/), 
  PAN: Joi.string().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/),
  website_url: Joi.string().uri(),
  location: Joi.string(),
  contact_email: Joi.string().email(),
  contact_No: Joi.string().pattern(/^[0-9]+$/), 
  headQuater_add: Joi.string()
})

exports.createOnboardCompany = async (req, res) => {
  const {email, mobile, company_name,overView,industry,company_size,GST,PAN,website_url,location,contact_email,contact_No,headQuater_add} = req.body;

  const { error } = OnboardRegistration.validate({ email, mobile, company_name,industry,company_size,GST,PAN,website_url,location,contact_email,contact_No,headQuater_add});
  const panImage = req?.files['panImage'] ? req?.files['panImage'][0]?.path : null;
  const gstImage = req?.files['gstImage'] ? req?.files['gstImage'][0]?.path : null;
  const profile = req?.files['profile'] ? req?.files['profile'][0]?.path : null;
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    const existingCompany = await Company.findOne({"HRs.email":email });
    if (existingCompany) {
      return res.status(400).json({ error: "Email already existed" });
    }
    const existingName = await Company.findOne({company_name});
    if (existingName) {
      return res.status(400).json({ error: "Company already existed" });
    }

    const existingMobile = await Company.findOne({mobile});
    if (existingMobile) {
      return res.status(400).json({ error: "Mobile number already existed" });
    }

    // let panText = '';
    //     let gstText = '';

        // if (panImage) {
        //     // Perform OCR on PAN image
        //     const panResult = await tesseract.recognize(panImage, 'eng');
        //     panText = panResult.data.text;
        // }

        // if (gstImage) {
        //     // Perform OCR on GST image
        //     const gstResult = await tesseract.recognize(gstImage, 'eng');
        //     gstText = gstResult.data.text;
        // }
        //gstText = preprocessText(gstText);
        // Extract the PAN and GST numbers from the text using regex
        // const panNumber = extractPAN(panText);
        // const gstNumber = extractGST(gstText);
        // if (panNumber != PAN) {
        //     return res.status(400).json({ error: "PAN number and PAN image number do not match" });
        // }
        // if (gstNumber !=GST) {
        //     return res.status(400).json({ error: "GST number and GST image number do not match" });
        // }


        const hashedPassword = await bcrypt.hash("Company12#", 12);
    const newCompany = new Company({
      email, mobile, company_name,overView,industry,company_size,GST,PAN,website_url,location,contact_email,contact_No,headQuater_add,GST_image:gstImage,PAN_image:panImage,profile,ImportStatus:true, HRs: [{ email, password: hashedPassword }]
    });

    const savedCompany = await newCompany.save();
    await sendMailToCompanys(email,"Company12#");

    return res.status(201).json({ message: "Company created Successfully", company: savedCompany });
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// const preprocessText = (text) => {
//   return text.replace(/[^A-Z0-9\s]/gi, '').replace(/\s+/g, ' ').trim();
// };
// // Function to extract PAN number from text using regex
// const extractPAN = (text) => {
//   const panRegex = /[A-Z]{5}[0-9]{4}[A-Z]{1}/;
//   const match = text.match(panRegex);
//   return match ? match[0] : null;
// };

// Function to extract GST number from text using regex
// const extractGST = (text) => {
//  const gstRegex = /\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}/;
//   const match = text.match(gstRegex);
//   return match ? match[0] : null;

// };


exports.getSingleCompany = async (req, res) => {
  const { id } = req.params;

  try {
    const data = await Company.findById(id); 

    if (data) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;

    // Helper function to check if a URL is a Google Drive link
    const isGoogleDriveLink = (url) => {
      return url && (url.includes('drive.google.com') || url.includes('docs.google.com'));
    };

    const updatedData = {
      ...data._doc,
      profileUrl: data.profile 
        ? (isGoogleDriveLink(data.profile) ? data.profile : `${baseUrl}/${data.profile.replace(/\\/g, '/')}`)
        : null,
      PANImageUrl: data.PAN_image 
        ? (isGoogleDriveLink(data.PAN_image) ? data.PAN_image : `${baseUrl}/${data.PAN_image.replace(/\\/g, '/')}`)
        : null,
      GSTImageUrl: data.GST_image 
        ? (isGoogleDriveLink(data.GST_image) ? data.GST_image : `${baseUrl}/${data.GST_image.replace(/\\/g, '/')}`)
        : null,
    };

      return res.status(200).json(updatedData);
    } else {
      return res.status(404).json({ error: "Company not found" });
    }

  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getAllOnboardCompany = async (req, res) => {
  try {
      const data = await Company.find({})
          .sort({ createdAt: -1 })
          .select({ company_name: 1, location: 1, email: 1, hrEmail: { $arrayElemAt: ["$HRs.email", 0] } });
      const MailSendCount=await Company.find({ImportStatus:false}).countDocuments()

      if (data && data.length > 0) {
          const updatedData = await Promise.all(
              data.map(async company => {
                  const subscription = await companySubscription
                      .findOne({
                          company_id: company._id,
                          expiresAt: { $gte: new Date() },
                          createdDate: { $lte: new Date() }
                      })
                      .select({ plane_name: 1 });
                  const objectId = new mongoose.Types.ObjectId(company._id);
                  const hiresCount = await CompanyJob.aggregate([
                      { $match: { company_id: objectId } },
                      {
                          $group: {
                              _id: '$company_id',
                              candidate_hired: {
                                  $sum: {
                                      $sum: {
                                          $size: {
                                              $filter: {
                                                  input: {
                                                      $ifNull: [
                                                          '$Shortlisted',
                                                          []
                                                      ]
                                                  },
                                                  as: 'shortlistedCandidate',
                                                  cond: {
                                                      $or: [
                                                          {
                                                              $eq: [
                                                                  '$$shortlistedCandidate.short_Candidate.offer_accepted_status',
                                                                  'Accepted'
                                                              ]
                                                          }
                                                      ]
                                                  }
                                              }
                                          }
                                      }
                                  }
                              }
                          }
                      }
                  ]);

                  return {
                      ...company._doc,
                      subscription,
                      hiresCount
                  };
              })
          );

          return res.status(200).send({updatedData,MailSendCount});
      }
      return res.status(200).send([]);
  } catch (error) {
      return res.status(500).json({ error: 'Internal Server Error' });
  }
};


exports.editOnboardCompany = async (req, res) => {
  const { 
    email, 
    mobile, 
    company_name,
    overView,
    industry,
    company_size,
    GST,
    PAN,
    website_url,
    location,
    contact_email,
    contact_No,
    headQuater_add 
  } = req.body;
  
  const { id } = req.params;

  const panImage = req?.files['panImage'] ? req?.files['panImage'][0]?.path : undefined;
  const gstImage = req?.files['gstImage'] ? req?.files['gstImage'][0]?.path : undefined;
  const profile = req?.files['profile'] ? req?.files['profile'][0]?.path : undefined;

  // Validate the input data
  const { error } = OnboardComapanyEdit.validate({
    mobile,
    company_name,
    email,
    industry,
    company_size,
    GST,
    PAN,
    website_url,
    location,
    contact_email,
    contact_No,
    headQuater_add
  });

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    const existingCompany = await Company.findById(id);
    if (!existingCompany) {
      return res.status(404).json({ error: "Company not found" });
    }
    if (email) {
      const existingHR = existingCompany.HRs.find((hr) => hr.email === email);
      if (!existingHR) {
        existingCompany.HRs[0].email = email;
        await existingCompany.save()
      }
    }

    // Prepare updated data
    const updatedData = {
      email,
      mobile,
      company_name,
      overView,
      industry,
      company_size,
      GST,
      PAN,
      website_url,
      location,
      contact_email,
      contact_No,
      headQuater_add,
      GST_image: gstImage || existingCompany.GST_image,
      PAN_image: panImage || existingCompany.PAN_image,
      profile: profile || existingCompany.profile,
    };

    // Update the company document
    const updatedCompany = await Company.findByIdAndUpdate(
      id,
      { $set: updatedData },
      { new: true }
    );

    return res.status(200).json({
      message: "Company details updated successfully",
      updatedCompany,
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};



exports.DownloadExcelTemplete = async (req, res) => {
  try {
    const data = [
      {
        Email: '',
        Mobile_No: '',
        Company_Name: '',
        Overview: '',
        Industry: '',
        Company_Size: '',
        GST_Number: '',
        GST_Image_URL:'',
        PAN_Number: '',
        PAN_Image_URL:'',
        Website_URL: '',
        Location: '',
        Contact_Email: '',
        Contact_Number: '',
        Headquarters_Address: ''
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(data);
    const columnWidths = Object.keys(data[0]).map((key) => ({
      wch: Math.max(key.length, 20)  // Ensuring a minimum width of 20 characters
    }));

    worksheet['!cols'] = columnWidths;
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="template.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(excelBuffer);

  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: "Internal Server error" });
  }
};

exports.uploadExcelFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const validatePAN = (pan) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);
    const validateGST = (gst) => /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gst);
    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const validateMobile = (mobile) => /^[6-9]\d{9}$/.test(mobile); // Assumes Indian mobile numbers
    const validateURL = (url) => /^(http|https):\/\/[^ "]+$/.test(url);

    if (sheetData.length === 0) {
      return res.status(400).json({ error: "Empty Excel File" });
    }

    function toCamelCase_Name(input) {
      if(typeof input=='string'){
      return input?input
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' '):null
      }else{
        return input;
      }
    }

    function toCamelCase_Sentence(input) {
      if(typeof input=='string'){
      return input?input
        .toLowerCase()
        .split('  ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' '):null
      }else{
        return input;
      }
    }

    for (const row of sheetData) {
      const Details = {
        company_name:row?.Company_Name?toCamelCase_Name(row.Company_Name):null,
        email: row.Email,
        mobile: row.Mobile_No,
        overview: row?.Overview?toCamelCase_Sentence( row.Overview ):null,
        industry:row.Industry?toCamelCase_Name(row.Industry):null,
        company_size: row.Company_Size,
        GST: row.GST_Number,
        PAN: row.PAN_Number,
        website_url: row.Website_URL,
        location:row.Location?toCamelCase_Name(row.Location):null,
        contact_email: row.Contact_Email,
        contact_No: row.Contact_Number,
        headQuarter_add:row.Headquarters_Address?toCamelCase_Name(row.Headquarters_Address):null,
        PAN_image: row.PAN_Image_URL,
        GST_image: row.GST_Image_URL,
        ImportStatus:false
      };


      if(!Details.company_name &&!Details.email&&!Details.mobile&&!Details.overview &&!Details.industry&&!Details.company_size&&!Details.PAN &&!Details.GST&&!Details.website_url&&!Details.location&&!Details.contact_email&&!Details.contact_No &&!Details.headQuarter_add&&!Details.PAN_image&&!Details.GST_image){
        return res.status(400).json({ error: "Empty Excel file" });
      }

      // Validate each field
      if (!Details.company_name || typeof Details.company_name !== 'string') {
        return res.status(400).json({ error: "Company name is required and must be a string." });
      }

      if (!Details.overview || typeof Details.overview !== 'string') {
        return res.status(400).json({ error: "OverView is required and must be a string." });
      }
      if (!Details.industry || typeof Details.industry !== 'string') {
        return res.status(400).json({ error: "Industry is required and must be a string." });
      }
      if (!Details.location || typeof Details.location !== 'string') {
        return res.status(400).json({ error: "Location is required and must be a string." });
      }
      if (!validateEmail(Details.contact_email)) {
        return res.status(400).json({ error: `Contact email address: "${Details.email}"` });
      }
      if (!validateEmail(Details.email)) {
        return res.status(400).json({ error: `Invalid email address: "${Details.email}"` });
      }
      if (!validateMobile(Details.mobile)) {
        return res.status(400).json({ error: `Invalid mobile number: "${Details.mobile}"` });
      }
      if (!validateMobile(Details.contact_No)) {
        return res.status(400).json({ error: `Invalid Contact mobile number: "${Details.mobile}"` });
      }
      if (Details.PAN && !validatePAN(Details.PAN)) {
        return res.status(400).json({ error: `Invalid PAN number: "${Details.PAN}"` });
      }
      if (Details.GST && !validateGST(Details.GST)) {
        return res.status(400).json({ error: `Invalid GST number: "${Details.GST}"` });
      }
      if (Details.website_url && !validateURL(Details.website_url)) {
        return res.status(400).json({ error: `Invalid website URL: "${Details.website_url}"` });
      }
      if (!Details.headQuarter_add || typeof Details.headQuarter_add !=='string') {
        return res.status(400).json({ error: `Invalid website URL: "${Details.website_url}"` });
      }

      // Check if the email already exists
      const existsCompany = await Company.findOne({company_name: Details.company_name});
      if (existsCompany) {
        return res.status(400).json({ error: `Company "${Details.company_name}" already created.` });
      }
      const existsEmail = await Company.findOne({ "HRs.email": Details.email });
      if (existsEmail) {
        return res.status(400).json({ error: `Email ID "${Details.email}" already exists in our database.` });
      }

      const existsMobile = await Company.findOne({ mobile: Details.mobile });
      if (existsMobile) {
        return res.status(400).json({ error: `Mobile Number "${Details.mobile}" already exists in our database.` });
      }

      // Check if the PAN number already exists
      const existPanNumber = await Company.findOne({ PAN: Details.PAN });
      if (existPanNumber) {
        return res.status(400).json({ error: `The PAN number "${Details.PAN}" already exists for the company "${existPanNumber.company_name}". Please check "${Details.company_name}" PAN number.` });
      }

      // Check if the GST number already exists
      const existGstNumber = await Company.findOne({ GST: Details.GST });
      if (existGstNumber) {
        return res.status(400).json({ error: `The GST number "${Details.GST}" already exists for the company "${existGstNumber.company_name}". Please check "${Details.company_name}" GST number.` });
      }

      // Function to check if the Google Drive URL is publicly accessible
      const isPubliclyAccessible = async (url) => {
        try {
          const response = await axios.get(url, { maxRedirects: 0 });
          return response.status === 200;
        } catch (error) {
          if (error.response && error.response.status === 200) {
            return true;
          }
          return false;
        }
      };

      // Check the PAN image URL
      if (Details.PAN_image) {
        const isPANImageAccessible = await isPubliclyAccessible(Details.PAN_image);
        if (!isPANImageAccessible) {
          return res.status(400).json({ error: `PAN image URL ${Details.PAN_image} is not publicly accessible` });
        }
      }

      // Check the GST image URL
      if (Details.GST_image) {
        const isGSTImageAccessible = await isPubliclyAccessible(Details.GST_image);
        if (!isGSTImageAccessible) {
          return res.status(400).json({ error: `GST image URL ${Details.GST_image} is not publicly accessible` });
        }
      }
    }
    const hashedPassword = await bcrypt.hash("Company12#", 12);
    
    for (const row of sheetData) {
      const Details = {
        company_name:row?.Company_Name?toCamelCase_Name(row.Company_Name):null,
        email: row.Email,
        HRs: [{ email:row.Email, password: hashedPassword }],
        mobile: row.Mobile_No,
        overview: row.Overview ?toCamelCase_Sentence( row.Overview ):null,
        industry:row.Industry?toCamelCase_Name(row.Industry):null,
        company_size: row.Company_Size,
        GST: row.GST_Number,
        PAN: row.PAN_Number,
        website_url: row.Website_URL,
        location:row.Location?toCamelCase_Name(row.Location):null,
        contact_email: row.Contact_Email,
        contact_No: row.Contact_Number,
        headQuarter_add:row.Headquarters_Address?toCamelCase_Name(row.Headquarters_Address):null,
        PAN_image: row.PAN_Image_URL,
        GST_image: row.GST_Image_URL,
        ImportStatus:false
      };

      if(!Details.company_name &&!Details.email&&!Details.mobile&&!Details.overview &&!Details.industry&&!Details.company_size&&!Details.PAN &&!Details.GST&&!Details.website_url&&!Details.location&&!Details.contact_email&&!Details.contact_No &&!Details.headQuarter_add&&!Details.PAN_image&&!Details.GST_image){
        return res.status(400).json({ error: "Empty Excel file" });
      }

      // Validate each field
      if (!Details.company_name || typeof Details.company_name !== 'string') {
        return res.status(400).json({ error: "Company name is required and must be a string." });
      }

      if (!Details.overview || typeof Details.overview !== 'string') {
        return res.status(400).json({ error: "OverView is required and must be a string." });
      }
      if (!Details.industry || typeof Details.industry !== 'string') {
        return res.status(400).json({ error: "Industry is required and must be a string." });
      }
      if (!Details.location || typeof Details.location !== 'string') {
        return res.status(400).json({ error: "Location is required and must be a string." });
      }
      if (!validateEmail(Details.contact_email)) {
        return res.status(400).json({ error: `Contact email address: "${Details.email}"` });
      }
      if (!validateEmail(Details.email)) {
        return res.status(400).json({ error: `Invalid email address: "${Details.email}"` });
      }
      if (!validateMobile(Details.mobile)) {
        return res.status(400).json({ error: `Invalid mobile number: "${Details.mobile}"` });
      }
      if (!validateMobile(Details.contact_No)) {
        return res.status(400).json({ error: `Invalid Contact mobile number: "${Details.mobile}"` });
      }
      if (Details.PAN && !validatePAN(Details.PAN)) {
        return res.status(400).json({ error: `Invalid PAN number: "${Details.PAN}"` });
      }
      if (Details.GST && !validateGST(Details.GST)) {
        return res.status(400).json({ error: `Invalid GST number: "${Details.GST}"` });
      }
      if (Details.website_url && !validateURL(Details.website_url)) {
        return res.status(400).json({ error: `Invalid website URL: "${Details.website_url}"` });
      }
      if (!Details.headQuarter_add || typeof Details.headQuarter_add !=='string') {
        return res.status(400).json({ error: `Invalid website URL: "${Details.website_url}"` });
      }

      // Check if the email already exists
      const existsCompany = await Company.findOne({company_name: Details?.company_name});
      if (existsCompany) {
        return res.status(400).json({ error: `Company "${Details.company_name}" already created.` });
      }

      const existsEmail = await Company.findOne({ "HRs.email":Details.email });
      if (existsEmail) {
        return res.status(400).json({ error: `Email ID "${Details.email}" already exists in our database.` });
      }

      const existsMobile = await Company.findOne({ mobile: Details.mobile });
      if (existsMobile) {
        return res.status(400).json({ error: `Mobile Number "${Details.mobile}" already exists in our database.` });
      }

      // Check if the PAN number already exists
      const existPanNumber = await Company.findOne({ PAN: Details.PAN });
      if (existPanNumber) {
        return res.status(400).json({ error: `The PAN number "${Details.PAN}" already exists for the company "${existPanNumber.company_name}". Please check "${Details.company_name}" PAN number.` });
      }

      // Check if the GST number already exists
      const existGstNumber = await Company.findOne({ GST: Details.GST });
      if (existGstNumber) {
        return res.status(400).json({ error: `The GST number "${Details.GST}" already exists for the company "${existGstNumber.company_name}". Please check "${Details.company_name}" GST number.` });
      }

      // Function to check if the Google Drive URL is publicly accessible
      const isPubliclyAccessible = async (url) => {
        try {
          const response = await axios.get(url, { maxRedirects: 0 });
          return response.status === 200;
        } catch (error) {
          if (error.response && error.response.status === 200) {
            return true;
          }
          return false;
        }
      };
      // Check the PAN image URL
      if (Details.PAN_image) {
        const isPANImageAccessible = await isPubliclyAccessible(Details.PAN_image);
        if (!isPANImageAccessible) {
          return res.status(400).json({ error: `PAN image URL ${Details.PAN_image} is not publicly accessible` });
        }
      }

      // Check the GST image URL
      if (Details.GST_image) {
        const isGSTImageAccessible = await isPubliclyAccessible(Details.GST_image);
        if (!isGSTImageAccessible) {
          return res.status(400).json({ error: `GST image URL ${Details.GST_image} is not publicly accessible` });
        }
      }

      // Save the details to the database
      let savedBasicDetails = await new Company(Details).save();
    }

    res.status(200).json({ message: `${sheetData.length} Companies Imported Successfully.`});
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.SendEmailImportedCandidate=async(req,res)=>{
  try{
     const companyDate=await Company.find({ImportStatus:false});

     for(let data of companyDate){
      await sendMailToCompanys(data.HRs[0]?.email,"Company12#",`https://didatabank.com/login`);
      data.ImportStatus=true;
     await data.save();
     }
     return res.status(200).json({message:"Email send successfully"});

  }catch(error){
    return res.status(500).json({error:"Internal server error"});
  }
}
