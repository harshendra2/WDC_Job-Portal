const mongoose=require("mongoose");
const tesseract = require('tesseract.js');
const company=require("../../models/Onboard_Company_Schema");
const axios= require("axios");

exports.GetCompanyProfile=async(req,res)=>{
    const {id}=req.params;
    try{
        const objectId = new mongoose.Types.ObjectId(id); 
        const data=await company.findById({_id:objectId});
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

    }catch(error){
        console.log(error);
     return res.status(500).json({error:"Internal server error"});
    }
}

exports.EditProfile = async (req, res) => {
    const { id } = req.params;
    const {
        company_name, email, mobile, overView, address, industry,
        company_size, GST, PAN, website_url, location, contact_email,
        contact_No, headQuater_add,GST_verify,PAN_verify
    } = req.body;

    const panImage = req.files['panImage'] ? req.files['panImage'][0].path : null;
    const gstImage = req.files['gstImage'] ? req.files['gstImage'][0].path : null;
    const profile=req.files['profile'] ? req.files['profile'][0].path:null;

    try {
        let panText = '';
        let gstText = '';

        if (panImage) {
            const panResult = await tesseract.recognize(panImage, 'eng');
            panText = panResult.data.text;
        }

        if (gstImage) {
            const gstResult = await tesseract.recognize(gstImage, 'eng');
            gstText = gstResult.data.text;
        }
        const panNumber = extractPAN(panText);
        const gstNumber = extractGST(gstText);

        if (panNumber != PAN) {
            return res.status(400).json({ error: "PAN number and PAN image number do not match" });
        }
        if (gstNumber !=GST) {
            return res.status(400).json({ error: "GST number and GST image number do not match" });
        }
        const companyData = {
          company_name, email, mobile, overView, address, industry,
          company_size, GST, PAN, website_url, location, contact_email,
          contact_No, headQuater_add,GST_verify,PAN_verify,status:'Processing',message:""
      };
         const panStatus=await company.findById(id);
         if(panStatus.self_PAN_verify){
          companyData.PAN=PAN
         }
         if(panStatus.self_GST_verify){
          companyData.GST=GST;
         }

        if (panImage) {
            companyData.PAN_image = panImage
        }
        if (gstImage) {
            companyData.GST_image = gstImage
        }
        if (profile){
            companyData.profile=profile
        }

        const updatedData = await company.findByIdAndUpdate(id, companyData, { new: true });

        if (updatedData) {
            return res.status(200).json({ message: "Profile updated successfully", company: updatedData });
        } else {
            return res.status(404).json({ error: "Profile not found" });
        }

    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
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