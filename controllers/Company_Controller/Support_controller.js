const Joi=require("joi");
const mongoose=require("mongoose");
const IssueSchema=require("../../models/Issue_Schema");
const chatModel=require("../../models/chatModel");
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
            return res.status(400).json({ error: "File is required" });
        }

        const createdData =new IssueSchema({
            Issue_type,
            description,
            company_id:new mongoose.Types.ObjectId(id),
            file: req.file.path 
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



//Chating session 

exports.createChat=async(req,res)=>{
    const { firstId, secondId } = req.body;
    try{
        const chat = await chatModel.findOne({
            members: { $all: [firstId, secondId] }
          });
          if (chat)
            return res.status(200).json(chat);
          const newChat = new chatModel({
            members: [firstId, secondId]
          });
          const response = await newChat.save();
          res.status(200).json(response);

    }catch(error){
return res.status(500).json({error:"Internal Server error"});
    }
}

exports.findUserChats=async(req,res)=>{
    const userId = req.params.userId;
    try{
        const chats = await chatModel.find({
            members: { $in: [userId] }
          });
          res.status(200).json(chats);

    }catch(error){
        return res.status(500).json({error:"Intrnal Server error"});
    }
}

exports.findChat=async(req,res)=>{
    const { firstId, secondId } = req.params;
    try{
        const chat = await chatModel.findOne({
            members: { $all: [firstId, secondId] }
          });
          res.status(200).json(chat);
    }catch(error){
        return res.status(500).json({error:"Internal Server error"});
    }
}



//Message Session 

exports.createMessage=async(req,res)=>{
    const { chatId, senderId, text } = req.body;
    try{
        const message = new messageModel({
            chatId, senderId, text
          });
          const response = await message.save();
          res.status(200).json(response);
    }catch(error){
        return res.status(500).json({error:"Intrernal Server Error"});
    }
}

exports.getMessages=async(req,res)=>{
    const { chatId } = req.params;
    try{
        const messages = await messageModel.find({ chatId });
        res.status(200).json(messages);
    }catch(error){
        return res.status(500).json({error:"Internal Server error"});
    }
}