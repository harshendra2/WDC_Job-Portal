const mongoose=require("mongoose");
const moment=require('moment');
const candidate=require('../../models/Onboard_Candidate_Schema');
const Issue=require('../../models/Issue_Schema');

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

exports.ViewDetails=async(arg)=>{
    console.log("controller",arg)
    try{
       const data=await candidate.findByIdAndUpdate(arg,{isRead:true}).populate('basic_details')
       .populate('education_details')
       .populate('work_details')
       .populate('personal_details');
      if(data){
        return data ||[]
      }
    }catch(error){
        throw error;
    }
}

//Issue notification
exports.getAllIssueNotificatio=async(companyId)=>{
    try{
        const companyObjectId = new mongoose.Types.ObjectId(companyId);
        const notificationData = await Issue.aggregate([
          { $match: { company_id: companyObjectId, isRead: false,status:'solved'} }
        ]);
        const formattedData = notificationData.map(notification => ({
            ...notification,
            solvedData: moment(notification.solved_date).fromNow()
          }));
      
          return formattedData || [];
    }catch(error){
        throw error;
    }
}

exports.ViewIssues=async(companyId)=>{
    try{
        const Id = new mongoose.Types.ObjectId(companyId);
        const updatedNotification = await Issue.updateMany(
          { company_id: Id, isRead: false },
          { $set: { isRead: true } } 
        );
    
        return updatedNotification || {};

    }catch(error){
        throw error;
    }
}