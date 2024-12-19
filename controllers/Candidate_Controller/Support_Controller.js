const Joi=require("joi");
const nodemailer=require('nodemailer');
const mongoose=require("mongoose");
const IssueSchema=require("../../models/Issue_Schema");
const messageModel=require("../../models/messageModel");
const CandidateTransaction=require('../../models/CandidateTransactionSchema');
const CurrentUserSub=require("../../models/Current_Candidate_SubscriptionSchema");

const IssueValidation=Joi.object({
    Issue_type:Joi.string().min(5).required(),
    description: Joi.string().min(5).required()
  })

  exports.AddNewIssue = async (req, res) => {
    const {userId} = req.params;
    const { Issue_type, description } = req.body;

    const { error } = IssueValidation.validate({ Issue_type, description });
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }

    try {
        if (!req.file) {
            return res.status(400).json({ error: "Please upload a file" });
          }
        const createdData =new IssueSchema({
            Issue_type,
            description,
            candidate_id:new mongoose.Types.ObjectId(userId),
            file:req.file?.path
        });

        const data = await createdData.save();
        return res.status(200).json(data);

    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
};


exports.getAllIssuesClaim=async(req,res)=>{
    const {userId}=req.params;
    try{
        const possibleSubscriptions = await CurrentUserSub.findOne({
            candidate_id: userId,
            expiresAt: { $gte: new Date() },
            createdDate: { $lte: new Date() }, 
            customer_support:true,
        });

        const data=await IssueSchema.find({candidate_id:userId}).sort({createdDate:-1})
        if(data){
            return res.status(200).send({data:data,possibleSubscriptions:possibleSubscriptions});
        }else{
           return res.status(200).send({data:data,possibleSubscriptions:possibleSubscriptions});
        }

    }catch(error){
        console.log(error)
        return res.status(500).json({error:"Internal Server Error"});
    }
}

exports.SendMailSupport=async(req,res)=>{
    const {Message,Subject}=req.body;
    const image=req.file
    try{
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.emailUser,
                pass: process.env.emailPassword,
            },
        });

        const mailOptions = {
            from: process.env.emailUser,
            to: 'harsendraraj20@gmail.com',
            subject: Subject || 'No Subject Provided',
            html: `
                <p>${Message || 'No message provided.'}</p>
                <p>Here is the attached screenshot:</p>
                <img src="cid:screenshot" alt="Screenshot" style="max-width:100%; height:auto; border:1px solid #ddd; padding:5px;">
            `,
            attachments: [
                {
                    filename: image.originalname, // Original name of the uploaded file
                    path: image.path, // Path where the file is stored
                    cid: 'screenshot', // This cid will be used in the img tag
                },
            ],
        };

        await transporter.sendMail(mailOptions);

        return res.status(200).json({ success: true, message: 'Email sent successfully!' });
    }catch(error){
        return res.status(500).json({error:"Internal server error"});
    }
}


exports.getTransaction=async(req,res)=>{
    const {userId}=req.params;
    try{
        if(!userId){
            return res.status(400).json({error:"Please provide user ID"});
        }
        const userID=new mongoose.Types.ObjectId(userId);
    const data=await CandidateTransaction.aggregate([{$match:{candidate_id:userID}}]).sort({
        purchesed_data:-1
        })
    if(data){
        return res.status(200).send(data);
    }
    }catch(error){
        return res.status(500).json({error:"Intrnal server error"});
    }
}