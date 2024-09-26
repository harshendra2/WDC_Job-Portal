const Joi=require("joi");
const mongoose=require("mongoose");
const IssueSchema=require("../../models/Issue_Schema");
const messageModel=require("../../models/messageModel");
const CandidateTransaction=require('../../models/CandidateTransactionSchema');

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
            file:req.file.path
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
        const data=await IssueSchema.findOne({candidate_id:userId}).sort({createdDate:-1})
        if(data){
            return res.status(200).send(data);
        }else{
            return res.status(400).json({message:"No Issues Claimed"});
        }

    }catch(error){
        return res.status(500).json({error:"Internal Server Error"});
    }
}

exports.getTransaction=async(req,res)=>{
    const {userId}=req.params;
    try{
        if(!userId){
            return res.status(400).json({error:"Please provide user ID"});
        }
        const userID=new mongoose.Types.ObjectId(userId);
    const data=await CandidateTransaction.aggregate([{$match:{candidate_id:userID}}])
    if(data){
        return res.status(200).send(data);
    }
    }catch(error){
        return res.status(500).json({error:"Intrnal server error"});
    }
}