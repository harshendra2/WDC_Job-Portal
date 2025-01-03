const Joi=require("joi");
const nodemailer=require('nodemailer');
const mongoose=require("mongoose");
const IssueSchema=require("../../models/Issue_Schema");
const messageModel=require("../../models/messageModel");
const CandidateTransaction=require('../../models/CandidateTransactionSchema');
const CurrentUserSub=require("../../models/Current_Candidate_SubscriptionSchema");
const Candidate=require("../../models/Onboard_Candidate_Schema")

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
            issueCategory:'Portal Tickets',
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

        const data=await IssueSchema.find({candidate_id:userId,issueCategory:'Portal Tickets'}).sort({createdDate:-1})
        if(data){
            return res.status(200).send({data:data,possibleSubscriptions:possibleSubscriptions});
        }else{
           return res.status(200).send({data:data,possibleSubscriptions:possibleSubscriptions});
        }

    }catch(error){
        return res.status(500).json({error:"Internal Server Error"});
    }
}

exports.GetAllMailIssue=async(req,res)=>{
    const {userId}=req.params;
    try{
        const possibleSubscriptions = await CurrentUserSub.findOne({
            candidate_id: userId,
            expiresAt: { $gte: new Date() },
            createdDate: { $lte: new Date() }, 
            customer_support:true,
        });

        const data=await IssueSchema.find({candidate_id:userId,issueCategory:"Mail Tickets"}).sort({createdDate:-1})
        if(data){
            return res.status(200).send({data:data,possibleSubscriptions:possibleSubscriptions});
        }else{
           return res.status(200).send({data:data,possibleSubscriptions:possibleSubscriptions});
        }
    }catch(error){
        return res.status(500).json({error:"Internal server error"});
    }
}

function generateToken(length = 7) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let token = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      token += characters[randomIndex];
    }
    return `TICKET-${token}`;
  }
  

exports.SendMailSupport=async(req,res)=>{
   const { Message, Subject } =req.body;
     const { userId } = req.params;
   
     try {
         const CandidateData = await Candidate.findById(userId).populate('basic_details');
         if (!CandidateData) {
             return res.status(404).json({ success: false, error: "Candidate not found." });
         }
         const token = generateToken();

         const transporter = nodemailer.createTransport({
             service: 'gmail',
             auth: {
                 user: process.env.emailUser,
                 pass: process.env.emailPassword,
             },
         });
   
         const mailOptions = {
           from: process.env.EMAIL_USER,
           to:CandidateData?.basic_details?.email,
           subject: `${Subject || 'No Subject Provided'} - (${token})`,

           html: `
           <p>Dear Support Team,</p>
   
           <p>You have received a new issue report from <strong>${CandidateData?.basic_details?.name}</strong>.</p>
           
           <p><strong>Message:</strong></p>
           <blockquote style="border-left: 4px solid #ddd; padding-left: 10px; color: #555; font-style: italic;">
               ${Message || 'No additional details were provided.'}
           </blockquote>
           
           <p>Please find the attached screenshot for reference:</p>
           <img 
               src="http://65.20.91.47:4000/${req.file.path}" 
               alt="Screenshot" 
               style="max-width: 100%; height: auto; border: 1px solid #ddd; padding: 5px; margin-top: 15px;"
           >
   
           <p style="margin-top: 20px;">Best regards,</p>
           <p><em>Your Support Team</em></p>
       `,
       };
         // Send email
         await transporter.sendMail(mailOptions);

         const issue = new IssueSchema({
            issueCategory: 'Mail Tickets',
            issueType: `${Subject || 'No Subject'} - (${token})`,
            description: Message,
            Ticket: token,
            candidate_id: new mongoose.Types.ObjectId(userId),
            file: req.file?.path || '',
          });
      
          await issue.save();
      
   
         return res.status(200).json({ success: true, message: 'Email sent successfully!' });
     } catch (error) {
        console.log(error)
         return res.status(500).json({ success: false, error: "Internal server error" });
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