const company=require('../../models/Onboard_Company_Schema');
const candidate=require("../../models/Onboard_Candidate_Schema");
const admin=require('../../models/adminSchema');
const support=require('../../models/Issue_Schema');

exports.NewCompanyCreated=async(adminId)=>{
    try{
        const notification=await company.find({
            isRead_profile: { 
                    $not: { $elemMatch: { admin_id: adminId } } 
                }
        })
      
              return notification || [];
    }catch(error){
      console.log(error);
    }
}

exports.ViewCompanyNotification=async(adminId,companyId)=>{
  console.log(adminId,companyId)
    try{
const datas={
  isRead:true,
  admin_id: adminId
}
      const data = await company.findOneAndUpdate(
        { _id: companyId },
        {$push:{isRead_profile:datas

        }}
    );

    return data || [];
    }catch(error){
        console.log(error);
    }
    }

    exports.NewCandidateCreated=async(adminId)=>{
      try{
        const candidates = await candidate.find({
          isRead_profile: { 
                  $not: { $elemMatch: { admin_id: adminId } } 
              }
      })
      .populate({
          path: 'basic_details',
          select: 'name email mobile'
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
        console.log(error);
      }
    }

    const calculateProfileCompletionPercentage = (data) => {
      if (!data) return 0;
      const basicFields = ['name', 'email', 'mobile'];
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

    exports.ViewCandidateNotification=async(adminId,candidateId)=>{
      try{
          const datas={
            isRead:true,
            admin_id: adminId
          }
        const data=await candidate.findOneAndUpdate({_id:candidateId},  {$push:{isRead_profile:datas}})
        if(data){
          return data ||[]
        }
      }catch(error){
      console.log(error);
      }
    }

    exports.GetSubAdminLogInNot=async(AdminId)=>{
      try{
        const data=await admin.find({});
      }catch(error){
        console.log(error);
      }
    }

    exports.GetSupportRequestNot=async()=>{
      try{
        const data = await support.find({ status: 'pending', adminIsRead: false });
        return data;
      }catch(error){
        console.log(error);
      }
    }

    exports.ViewSupportNotification=async(ID)=>{
      try{
            const data=await support.findByIdAndUpdate(ID,{adminIsRead:true},{new:true});
            return data;
      }catch(error){
        console.log(error);
      }
    }

    exports.KYCVerificationRequest=async()=>{
      try{
        const data=await company.find({status:'processing',GST_verify:false,PAN_verify:false, isView:false}).select('name _id');
        return data;
      }catch(error){
        console.log(error);
      }
    }

    exports.ViewKYCreqyest=async(cmpID)=>{
      try{
        const updatedData = await company.findByIdAndUpdate(cmpID,{isView:true}, {
          new: true
      });
      return updatedData;
      }catch(error){
        console.log(error);
      }
    }