const mongoose=require("mongoose");
const tesseract = require('tesseract.js');
const Joi=require('joi');
const company=require("../../models/Onboard_Company_Schema");
const axios= require("axios");

const EditCompanyProfile=Joi.object({
  company_name: Joi.string().min(3).max(100).required(),
  email: Joi.string().email().required(), 
  mobile: Joi.string().pattern(/^[0-9]{10}$/).required(),
  overView: Joi.string().optional(),
  industry: Joi.string().optional(),
  company_size: Joi.number().integer().min(1).max(10000).optional(),
  PAN: Joi.string().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).optional(),
  website_url: Joi.string().uri().optional(),
  location: Joi.string().optional(),
  contact_email: Joi.string().email().optional(),
  contact_No: Joi.string().pattern(/^[0-9]{10}$/).optional(),
  headQuater_add: Joi.string().optional()
})

exports.GetCompanyProfile = async (req, res) => {
  const { id } = req.params;
  try {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const objectId = new mongoose.Types.ObjectId(id); 
    const data = await company.findById({ _id: objectId })
      .populate({
        path: 'Candidate_Feed_Back.candidate_id', 
       select: 'profile basic_details',
       populate: {
        path: 'basic_details',
        select: 'name'
      }
      })

    if (data) {
      const isGoogleDriveLink = (url) => {
        return url && (url.includes('drive.google.com') || url.includes('docs.google.com'));
      };

      const starRating = data?.Candidate_Feed_Back.map((temp) => temp.rating);
      const totalRating = starRating.reduce((acc, rating) => acc + rating, 0);
      const averageRating = starRating.length > 0 ? totalRating / starRating.length : 0;
      const updatedData = {
        ...data._doc,
        averageRating,
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

      const fields = [
        'company_name', 'email', 'mobile', 'overView',
        'industry', 'company_size', 'GST', 'GST_image', 'PAN',
        'PAN_image', 'website_url', 'location', 'contact_email',
        'contact_No', 'headQuater_add', 'profile'
      ];
      const PanVerifyingField = 'status';

      let filledFields = 0;
      fields.forEach(field => {
        if (data[field]) {
          filledFields++;
        }
      });
      if (data[PanVerifyingField] === 'approve') {
        filledFields++;
      }
      const totalFields = fields.length + 1;
      const profileCompletionPercentage = Math.round((filledFields / totalFields) * 100);

      return res.status(200).json({ updatedData, profileCompletionPercentage });
    } else {
      return res.status(404).json({ error: "Company not found" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.GetSavedProfileData=async(req,res)=>{
  const {id}=req.params;
  try{
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const objectId = new mongoose.Types.ObjectId(id); 
    const data = await company.findById({ _id: objectId })

    if (data) {
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

      return res.status(200).send(updatedData)
    } else {
      return res.status(404).json({ error: "Company not found" });
    }
  }catch(error){
    return res.status(500).json({error:"Internal server error"});
  }
}



// Function to extract PAN number from text using regex
exports.EditProfile = async (req, res) => {
  const { id } = req.params;
  const {
      company_name,
      email,
      mobile,
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
  const { error } = EditCompanyProfile.validate({
      company_name,
      email,
      mobile,
      overView,
      industry,
      company_size,
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

  // Image paths
  const panImage = req?.files['panImage']
      ? req?.files['panImage'][0]?.path
      : null;
  const gstImage = req?.files['gstImage']
      ? req?.files['gstImage'][0]?.path
      : null;
  const profile = req?.files['profile']
      ? req?.files['profile'][0]?.path
      : null;

  try {
      const previousDetails = await company.findById(id);
      if (!previousDetails) {
          return res.status(404).json({ error: 'Company profile not found' });
      }

      let companyData = {
          company_name,
          email,
          mobile,
          overView,
          industry,
          company_size,
          website_url,
          location,
          contact_email,
          contact_No,
          headQuater_add,
          GST_verify: false,
          PAN_verify: false,
          message: ''
      };

      // Depending on status, process the relevant fields
      switch (previousDetails.status) {
          case 'processing':
              companyData = {
                  ...companyData,
                  GST,
                  PAN,
                  status: 'processing'
              };
              if (panImage) companyData.PAN_image = panImage;
              if (gstImage) companyData.GST_image = gstImage;
              if (profile) companyData.profile = profile;
              break;

          case 'approve':
              companyData.status = 'approve';
              if (profile) companyData.profile = profile;
              break;

          case 'reject':
              companyData = {
                  ...companyData,
                  GST,
                  PAN,
                  status: 'processing',
                  Attempt_count:previousDetails?.Attempt_count+1
              };
              if (panImage) companyData.PAN_image = panImage;
              if (gstImage) companyData.GST_image = gstImage;
              if (profile) companyData.profile = profile;
              break;

          default:
              return res
                  .status(400)
                  .json({ error: 'Invalid company status' });
      }

      const updatedData = await company.findByIdAndUpdate(id, companyData, {
          new: true
      });

      if (updatedData) {
          return res.status(200).json({
              message: 'Profile updated successfully',
              company: updatedData
          });
      } else {
          return res.status(404).json({ error: 'Profile not found' });
      }
  } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
  }
};


const extractPAN = (text) => {
    const panRegex = /[A-Z]{5}[0-9]{4}[A-Z]{1}/;
    const match = text.match(panRegex);
    return match ? match[0] : null;
};

// Function to extract GST number from text using regex
// const extractGST = (text) => {
//     const gstRegex = /\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}/;
//     const match = text.match(gstRegex);
//     return match ? match[0] : null;
// };


//Company GST Card Verify
exports. ComapnyGSTerify = async (req, res) => {
    const { GST } = req.body;
    const {id}=req.params;
    const apiUrl = 'https://api.cashfree.com/verification/gst';
    const clientId = process.env.CASHFREE_CLIENT_ID; // Assuming you store these in your environment variables
    const clientSecret = process.env.CASHFREE_CLIENT_SECRET;
  
    const requestData = {
      gst: GST
    };
  
    const requestOptions = {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-client-id': clientId,
        'x-client-secret': clientSecret
      },
      body: JSON.stringify(requestData)
    };
  
    try {
      const response = await axios(apiUrl, requestOptions);
      const responseData = await response.json();
  
      if (response.ok && responseData.valid) {
        await company.findByIdAndUpdate(id, { self_GST_verify: true });
        const output = { status: true, responseData };
        return res.status(200).json(output);
      } else {
        const output = { status: false, responseData };
        return res.status(400).json(output);
      }
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  };

  exports.CompanyPANVerify = async (req, res) => {
    const { PAN } = req.body;
    const { id } = req.params;
    const apiUrl = 'https://api.cashfree.com/verification/pan';
    const clientId = process.env.CASHFREE_CLIENT_ID; 
    const clientSecret = process.env.CASHFREE_CLIENT_SECRET;
  
    const requestData = {
      pan: PAN
    };
  
    const requestOptions = {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-client-id': clientId,
        'x-client-secret': clientSecret
      },
      data: requestData
    };
  
    try {
      const response = await axios(apiUrl, requestOptions);
      const responseData = response.data;
  
      if (response.status === 200 && responseData.valid) {
        await company.findByIdAndUpdate(id, { self_PAN_verify: true });
        const output = { status: true, responseData };
        return res.status(200).json(output);
      } else {
        const output = { status: false, responseData };
        return res.status(400).json(output);
      }
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
};