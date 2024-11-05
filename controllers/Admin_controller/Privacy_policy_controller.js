const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const Tesseract = require('tesseract.js');
const fs = require('fs').promises; 
const path = require('path');
const TermPrivacy = require('../../models/Terms_PrivarySchema');

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
    } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        try {
            const { value } = await mammoth.extractRawText({ buffer: file.buffer });
            return value.trim().length > 0;
        } catch (error) {
            console.error('Error reading DOCX file with mammoth:', error);
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
            const relativeFilePath = path.join('Images', fileName); 
            const absoluteFilePath = path.resolve(__dirname, '../../', relativeFilePath);

            await fs.writeFile(absoluteFilePath, req.file.buffer);

            let existData = await TermPrivacy.findOne({});
            if (!existData) {
                let data = new TermPrivacy({ privacy_image: relativeFilePath });
                await data.save();
                return res.status(200).json({ message: "Privacy file uploaded successfully" });
            } else {
                let updatedData = await TermPrivacy.findByIdAndUpdate(existData._id, { privacy_image: relativeFilePath }, { new: true });
                if (updatedData) {
                    return res.status(200).json({ message: "Privacy file updated successfully" });
                } else {
                    return res.status(500).json({ message: "Error updating privacy file" });
                }
            }
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
            const relativeFilePath = path.join('Images', fileName); 
            const absoluteFilePath = path.resolve(__dirname, '../../', relativeFilePath);

            await fs.writeFile(absoluteFilePath, req.file.buffer);

            let existData = await TermPrivacy.findOne({});
            if (!existData) {
                let data = new TermPrivacy({ terms_image: relativeFilePath });
                await data.save();
                return res.status(200).json({ message: "Terms file uploaded successfully" });
            } else {
                let updatedData = await TermPrivacy.findByIdAndUpdate(existData._id, { terms_image: relativeFilePath }, { new: true });
                if (updatedData) {
                    return res.status(200).json({ message: "Terms file updated successfully" });
                } else {
                    return res.status(500).json({ message: "Error updating privacy file" });
                }
            }
        } else {
            return res.status(400).json({ error: 'File is not readable or is empty' });
        }
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
}