const mongoose=require("mongoose");
const tesseract = require('tesseract.js');
const fs = require('fs');
const company=require("../../models/Onboard_Company_Schema");

exports.GetCompanyProfile=async(req,res)=>{
    const {id}=req.params;
    try{
        const objectId = new mongoose.Types.ObjectId(id); 
        const data=await company.findById({_id:objectId});
        if(data){
            return res.status(200).send(data)
        }else{
            return res.status(400).json({error:"Empty data base"});
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
        contact_No, headQuater_add
    } = req.body;

    const panImage = req.files['panImage'] ? req.files['panImage'][0].path : null;
    const gstImage = req.files['gstImage'] ? req.files['gstImage'][0].path : null;
    try {
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
        if (gstNumber != GST) {
            return res.status(400).json({ error: "GST number and GST image number do not match" });
        }

        const companyData = {
            company_name, email, mobile, overView, address, industry,
            company_size, GST, PAN, website_url, location, contact_email,
            contact_No, headQuater_add
        };

        // Store image URLs instead of paths
        if (panImage) {
            companyData.PAN_image = path.join('/images', path.basename(panImage));
        }
        if (gstImage) {
            companyData.GST_image = path.join('/images', path.basename(gstImage));
        }

        console.log( companyData.PAN_image)

        // const updatedData = await company.findByIdAndUpdate(id, companyData, { new: true });

        // if (updatedData) {
            return res.status(200).json({ message: "Profile updated successfully" });
        // } else {
        //     return res.status(404).json({ error: "Profile not found" });
        // }

    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    } finally {
        // Clean up the uploaded files if needed
        if (panImage) fs.unlinkSync(panImage);
        if (gstImage) fs.unlinkSync(gstImage);
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