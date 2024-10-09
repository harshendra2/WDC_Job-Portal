const mongoose=require("mongoose");
const moment=require('moment');
const candidate=require('../../models/Onboard_Candidate_Schema');
const Issue=require('../../models/Issue_Schema');

//Chat Session 

exports.getAllnotificatio=async(companyId)=>{
    try{
        const candidates = await candidate.find({
            isRead_profile: { 
                    $not: { $elemMatch: { company_id: companyId } } 
                }
        })
        .populate({
            path: 'basic_details',
            select: 'name email mobile linkedIn'
        })
        .populate({path:'work_details', select:'aspiring_position current_location'})
        .populate({path:'personal_details', select:'spouse_profession Pan_verified_status Aadhar_verified_status'});

        // Filter candidates with 100% profile completion
        const completeCandidates = candidates.filter(candidate => {
            const profileCompletionPercentage = calculateProfileCompletionPercentage(candidate);
            return profileCompletionPercentage == 100;
        });

        return completeCandidates || [];
    }catch(error){
        throw error;
    }
}

const calculateProfileCompletionPercentage = (data) => {
    if (!data) return 0;
    const basicFields = ['name', 'email', 'mobile', 'linkedIn'];
    const workFields = [
        'aspiring_position','current_location'
    ];
    const personalFields = [
        'spouse_profession', 'Pan_verified_status', 'Aadhar_verified_status'
    ];

    // Utility function to count filled fields
    const calculateFilledFields = (details, fields) => {
        let filled = 0;
        if (!details) return filled;

        fields.forEach(field => {
            if (details[field] !== undefined && details[field] !== null && details[field] !== '' && details[field] !== false) {
                filled++;
            } else {
            }
        });
        return filled;
    };

    const totalBasicFields = basicFields.length;
    const filledBasicFields = calculateFilledFields(data.basic_details, basicFields);

    const totalWorkFields = workFields.length;
    const filledWorkFields = calculateFilledFields(data.work_details, workFields);

    const totalPersonalFields = personalFields.length;
    const filledPersonalFields = calculateFilledFields(data.personal_details, personalFields);

    const totalFields = totalBasicFields + totalWorkFields + totalPersonalFields;
    const filledFields = filledBasicFields  + filledWorkFields + filledPersonalFields;

    // Calculate profile completion percentage
    const profileCompletionPercentage = Math.round((filledFields / totalFields) * 100);
    return profileCompletionPercentage;
};

exports.ViewDetails=async(companyId,arg)=>{
    try{
        const temp={
          isRead:true,
          company_id:companyId
        }
        const data = await candidate.findOneAndUpdate(
            { _id: arg},
            { $push: { isRead_profile: temp } },
            { new: true }
          )
          .populate({
            path: 'basic_details',
            select: 'name email mobile linkedIn'
        })
        .populate({path:'work_details', select:'aspiring_position current_location'})
        .populate({path:'personal_details', select:'spouse_profession'});

      
          if (data) {
            return data;
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
