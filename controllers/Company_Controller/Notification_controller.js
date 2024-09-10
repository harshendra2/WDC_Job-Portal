const mongoose=require("mongoose");
const candidate=require('../../models/Onboard_Candidate_Schema');

//Chat Session 

exports.getAllnotificatio=async()=>{
    try{
     const notification=await candidate.find({isRead:false}).populate('basic_details')
     .populate('education_details')
     .populate('work_details')
     .populate('personal_details');

        return notification || [];

    }catch(error){
        console.log(error);
        throw error;
    }
}

exports.ViewDetails=async(req,res)=>{
    const {userId}=req.params;
    try{
       const data=await candidate.findByIdAndUpdate(userId,{isRead:true})
       if(data){
        return res.status(200).json({message:"Candidate details viewed"});
       }

    }catch(error){
        return res.status(500).json({error:"Internal Server Error"});
    }
}