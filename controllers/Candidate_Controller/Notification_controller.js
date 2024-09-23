const mongoose=require("mongoose");
const company=require('../../models/Onboard_Company_Schema');

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