const Joi=require("joi");
const mongoose=require("mongoose");
const IssueSchema=require("../../models/Issue_Schema");
const messageModel=require("../../models/messageModel");

const IssueValidation=Joi.object({
    Issue_type:Joi.string().min(5).required(),
    description: Joi.string().min(5).required()
  })

  exports.AddNewIssue = async (req, res) => {
    const { id } = req.params;
    const { Issue_type, description } = req.body;

    const { error } = IssueValidation.validate({ Issue_type, description });
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }

    try {
        if (!req.file) {
            return res.status(400).json({ error: "Please upload a file" });
          }
          // Construct the file URL
        const fileUrl = `${req.protocol}://${req.get("host")}/Images/${req.file.filename}`;
        const createdData =new IssueSchema({
            Issue_type,
            description,
            company_id:new mongoose.Types.ObjectId(id),
            file:fileUrl 
        });

        const data = await createdData.save();
        return res.status(200).json(data);

    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
};


exports.getAllIssuesClaim=async(req,res)=>{
    const {id}=req.params;
    try{
        const data=await IssueSchema.findOne({company_id:id});
        if(data){
            return res.status(200).send(data);
        }else{
            return res.status(400).json({message:"No Issues Claimed"});
        }

    }catch(error){
        return res.status(500).json({error:"Internal Server Error"});
    }
}

//Chat Session 

exports.getAllMessages=async(Id)=>{
    try{
     const message=await messageModel.find({Issue_id:Id});
        return message || [];

    }catch(error){
        console.log(error);
        throw error;
    }
}

exports.saveNewMessage=async(msg)=>{
    try{
        const newMessage = new messageModel(msg)
        await newMessage.save()
        return newMessage
    }catch(error){
        console.log(error);
        throw error;
    }
}
