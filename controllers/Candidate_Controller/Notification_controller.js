const mongoose=require("mongoose");
const company=require('../../models/Onboard_Company_Schema');

//Chat Session 

exports.getAllnotificatio=async()=>{
    try{
     const notification=await company.find({isRead:false})

        return notification || [];

    }catch(error){
        console.log(error);
        throw error;
    }
}

exports.ViewDetails=async(arg)=>{
    try{
       const data=await company.findByIdAndUpdate(arg,{isRead:true})
      if(data){
        return data ||[]
      }
    }catch(error){
        return res.status(500).json({error:"Internal Server Error"});
    }
}