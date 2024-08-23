const Company = require("../../models/Onboard_Company_Schema");
const Joi = require("joi");
const XLSX = require('xlsx');
const axios=require('axios');
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

        // Extract the PAN and GST numbers from the text using regex
        const panNumber = extractPAN(panText);
        const gstNumber = extractGST(gstText);

        if (panNumber != PAN) {
            return res.status(400).json({ error: "PAN number and PAN image number do not match" });
        }
        if (gstNumber !=GST) {
            return res.status(400).json({ error: "GST number and GST image number do not match" });
        }



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


exports.getSingleCompany=async(req,res)=>{
  const {id}=req.params;
  try{
    const data=await Company.findById({_id:id});
    if(data){
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

  }catch(error){
    return res.status(500).json({error:"Internal Server Error"});
  }
}


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
  const { error } = OnboardComapanyEdit.validate({mobile,company_name,email});
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    const updatedCompany = await Company.findByIdAndUpdate(
      id,
      {email, mobile, company_name,overView,industry,company_size,GST,PAN,website_url,location,contact_email,contact_No,headQuater_add,GST_image:gstImage,PAN_image:panImage},
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

    for (const row of sheetData) {
      const Details = {
        company_name: row.Company_Name,
        email: row.Email,
        mobile: row.Mobile_No,
        overview: row.Overview,
        industry: row.Industry,
        company_size: row.Company_Size,
        gst_number: row.GST_Number,
        pan_number: row.PAN_Number,
        Website_URL: row.Website_URL,
        location: row.location,
        contact_email: row.Contact_Email,
        contact_number: row.Contact_Number,
        Headquarters_Address: row.Headquarters_Address,
        PAN_image: row.PAN_Image_URL,
        GST_image: row.GST_Image_RUL,
      };

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

    res.status(200).json({ message: 'File processed and data stored successfully' });
  } catch (error) {
    console.error('Error processing the file:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};