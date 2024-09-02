const Company = require("../../models/Onboard_Company_Schema");
const Joi = require("joi");
const XLSX = require('xlsx');
const axios=require('axios');
const tesseract = require('tesseract.js');
const nodemailer=require('nodemailer');

//email config
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user:"harsendraraj20@gmail.com",
    pass:'ukiovyhquvazeomy',
  },
});

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
  email:Joi.string().email().required()
})

exports.createOnboardCompany = async (req, res) => {
  const {email, mobile, company_name,overView,industry,company_size,GST,PAN,website_url,location,contact_email,contact_No,headQuater_add} = req.body;

  const { error } = OnboardRegistration.validate({ email, mobile, company_name});
  const panImage = req.files['panImage'] ? req.files['panImage'][0].path : null;
  const gstImage = req.files['gstImage'] ? req.files['gstImage'][0].path : null;
  const profile = req.files['profile'] ? req.files['profile'][0].path : null;
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    const existingCompany = await Company.findOne({ email });
    if (existingCompany) {
      return res.status(400).json({ error: "Email already created" });
    }

    let panText = '';
        let gstText = '';

        if (panImage) {
            // Perform OCR on PAN image
            const panResult = await tesseract.recognize(panImage, 'eng');
            panText = panResult.data.text;
        }

        if (gstImage) {
            // Perform OCR on GST image
            const gstResult = await tesseract.recognize(gstImage, 'eng');
            gstText = gstResult.data.text;
        }
        gstText = preprocessText(gstText);
        // Extract the PAN and GST numbers from the text using regex
        const panNumber = extractPAN(panText);
        const gstNumber = extractGST(gstText);
        if (panNumber != PAN) {
            return res.status(400).json({ error: "PAN number and PAN image number do not match" });
        }
        // if (gstNumber !=GST) {
        //     return res.status(400).json({ error: "GST number and GST image number do not match" });
        // }



    const newCompany = new Company({
      email, mobile, company_name,overView,industry,company_size,GST,PAN,website_url,location,contact_email,contact_No,headQuater_add,GST_image:gstImage,PAN_image:panImage,profile
    });

    const savedCompany = await newCompany.save();

    return res.status(201).json({ message: "Company created Successfully", company: savedCompany });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const preprocessText = (text) => {
  return text.replace(/[^A-Z0-9\s]/gi, '').replace(/\s+/g, ' ').trim();
};
// Function to extract PAN number from text using regex
const extractPAN = (text) => {
  const panRegex = /[A-Z]{5}[0-9]{4}[A-Z]{1}/;
  const match = text.match(panRegex);
  return match ? match[0] : null;
};

// Function to extract GST number from text using regex
const extractGST = (text) => {
 const gstRegex = /\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}/;
  const match = text.match(gstRegex);
  return match ? match[0] : null;

};


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
    const data = await Company.find({}).sort({ createdAt: -1 });
    if (data) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      
      const updatedData = data.map(company => {
        return {
          ...company._doc, // Spread the existing company data
          panImageUrl: company.PAN_image ? `${baseUrl}/${company.PAN_image.replace(/\\/g, '/')}` : null, // Replace backslashes with forward slashes
          gstImageUrl: company.GST_image ? `${baseUrl}/${company.GST_image.replace(/\\/g, '/')}` : null, // Replace backslashes with forward slashes
        };
      });
      
      return res.status(200).send(updatedData);
    }

  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};


exports.editOnboardCompany = async (req, res) => {
  const {email, mobile, company_name,overView,industry,company_size,GST,PAN,website_url,location,contact_email,contact_No,headQuater_add} = req.body;
  const { id } = req.params;
  const panImage = req.files['panImage'] ? req.files['panImage'][0].path : null;
  const gstImage = req.files['gstImage'] ? req.files['gstImage'][0].path : null;
  const profile = req.files['profile'] ? req.files['profile'][0].path : null;
  const { error } = OnboardComapanyEdit.validate({mobile,company_name,email});
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    const updatedCompany = await Company.findByIdAndUpdate(
      id,
      {email, mobile, company_name,overView,industry,company_size,GST,PAN,website_url,location,contact_email,contact_No,headQuater_add,GST_image:gstImage,PAN_image:panImage,profile},
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


// download and upload Excel Sheets

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

    for (const row of sheetData) {
      const Details = {
        company_name: row.Company_Name,
        email: row.Email,
        mobile: row.Mobile_No,
        overview: row.Overview,
        industry: row.Industry,
        company_size: row.Company_Size,
        GST: row.GST_Number,
        PAN: row.PAN_Number,
        website_url: row.Website_URL,
        location: row.Location,
        contact_email: row.Contact_Email,
        contact_No: row.Contact_Number,
        headQuarter_add: row.Headquarters_Address,
        PAN_image: row.PAN_Image_URL,
        GST_image: row.GST_Image_URL,
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

      const existsEmail = await Company.findOne({ email: Details.email });
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

    for (const row of sheetData) {
      const Details = {
        company_name: row.Company_Name,
        email: row.Email,
        mobile: row.Mobile_No,
        overview: row.Overview,
        industry: row.Industry,
        company_size: row.Company_Size,
        GST: row.GST_Number,
        PAN: row.PAN_Number,
        website_url: row.Website_URL,
        location: row.Location,
        contact_email: row.Contact_Email,
        contact_No: row.Contact_Number,
        headQuarter_add: row.Headquarters_Address,
        PAN_image: row.PAN_Image_URL,
        GST_image: row.GST_Image_URL,
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

      const existsEmail = await Company.findOne({ email: Details.email });
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
      const savedBasicDetails = await new Company(Details).save();
    }

    res.status(200).json({ message: `${sheetData.length} companies imported successfully.` });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};
