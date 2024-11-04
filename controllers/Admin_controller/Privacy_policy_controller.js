const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const Tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');
const TermPrivacy= require('../../models/Terms_PrivarySchema');

async function checkFileReadability(file) {
    if (file.mimetype === 'application/pdf') {
        try {
            if (!file.buffer) {
                throw new Error('File buffer is undefined');
            }

            const data = await pdfParse(file.buffer);
            if (data.text.trim().length > 0) {
                return true; 
            }
        } catch (error) {
            console.error('Error reading PDF with pdf-parse:', error);
        }
        try {
            const ocrData = await Tesseract.recognize(file.buffer, 'eng+spa');
            if (ocrData.data && ocrData.data.text) {
                return ocrData.data.text.trim().length > 0;
            }
        } catch (ocrError) {
            console.error('Error reading PDF with OCR:', ocrError);
            return false;
        }
    } else if (
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
        try {
            const { value } = await mammoth.extractRawText({ buffer: file.buffer });
            return value.trim().length > 0;
        } catch (error) {
            return false;
        }
    } else {
        return false;
    }
}

exports.AddCompanyPrivacyPolicy = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
    
        const isReadable = await checkFileReadability(req.file);
      
        if (isReadable) {
            const fileName = `${req.file.fieldname}_${Date.now()}${path.extname(req.file.originalname)}`;
            const filePath = path.join(__dirname, '../../Images', fileName);
    
            fs.writeFile(filePath, req.file.buffer, (err) => {
                if (err) {
                    return res.status(500).json({ error: 'Failed to save file' });
                }})
            return res.status(200).json({ message: 'File is readable' });
        } else {
            return res.status(400).json({ error: 'File is not readable or is empty' });
        }
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
};


exports.AddNewTermsFiles=async(req,res)=>{
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
    
        const isReadable = await checkFileReadability(req.file);
      
        if (isReadable) {
            const fileName = `${req.file.fieldname}_${Date.now()}${path.extname(req.file.originalname)}`;
            const filePath = path.join(__dirname, '../../Images', fileName);
    
            fs.writeFile(filePath, req.file.buffer, (err) => {
                if (err) {
                    return res.status(500).json({ error: 'Failed to save file' });
                }})
            return res.status(200).json({ message: 'File is readable' });
        } else {
            return res.status(400).json({ error: 'File is not readable or is empty' });
        }
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
}