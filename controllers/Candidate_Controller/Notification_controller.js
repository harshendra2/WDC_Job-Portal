const mongoose=require("mongoose");
const company=require('../../models/Onboard_Company_Schema');
const candidate=require('../../models/Onboard_Candidate_Schema')
const Issue=require('../../models/Issue_Schema');
const moment=require('moment')

exports.getAllnotificatio=async(userId)=>{
    try{
     //const notification=await company.find({ 'isRead_profile.candidate_id': { $ne:userId }})
     const notification=await company.find({
      isRead_profile: { 
              $not: { $elemMatch: { candidate_id: userId } } 
          }
  })

        return notification || [];

    }catch(error){
        console.log(error);
        throw error;
    }
}

exports.ViewDetails=async(userId,companyId)=>{
    try{
      const IsReadData={
        isRead:true,
        candidate_id:userId
      }
      const data = await company.findByIdAndUpdate(
        companyId,
        {$push:{isRead_profile:IsReadData}},
        { new: true }
      );
      if (data) {
        return data || [];
      }
      
    }catch(error){
        return error;
    }
}


//Issue notification
exports.getAllIssueNotificatio=async(userId)=>{
    try{
        const CandidateObjectId = new mongoose.Types.ObjectId(userId);
        const notificationData = await Issue.aggregate([
          { $match: { candidate_id: CandidateObjectId, isRead: false,status:'solved'} }
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

exports.ViewIssues=async(userId)=>{
    try{
        const Id = new mongoose.Types.ObjectId(userId);
        const updatedNotification = await Issue.updateMany(
          { candidate_id: Id, isRead: false },
          { $set: { isRead: true } } 
        );
    
        return updatedNotification || {};

    }catch(error){
        throw error;
    }
}


exports.GetAllCVviewedCompany=async(userId)=>{
    try{
        const notification = await candidate.aggregate([
            { $match: { _id: mongoose.Types.ObjectId(userId) } }, 
            { $unwind: "$profile_view_company" }, 
            { $match: { "profile_view_company.is_read": false } },
            { 
              $project: {
                _id: 1,
                "profile_view_company.company_id": 1,
                "profile_view_company.is_read": 1
              }
            }
          ]);
      
          return notification || [];
    }catch(error){
        throw error;
    }
}

exports.CandidateViewedCompany=async(userId,companyId)=>{
 try{
    const userID = new mongoose.Types.ObjectId(userId);
    const companyID = new mongoose.Types.ObjectId(companyId);
    const data = await candidate.findOneAndUpdate(
        { _id: userID, 'profile_view_company.company_id': companyID },
        { $set: { 'profile_view_company.$.is_read': true } }, 
        { new: true }
      );
  
      if (data) {
        await candidate.findOneAndUpdate(
          { _id: userID },
          { $pull: { profile_view_company: { company_id: companyID } } },
          { new: true }
        );
      }
  
      return data || [];
    }catch(error){
        throw error;
    }
}
