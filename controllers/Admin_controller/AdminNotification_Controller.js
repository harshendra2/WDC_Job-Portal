const company=require('../../models/Onboard_Company_Schema');
const candidate=require("../../models/Onboard_Candidate_Schema");

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
    try{

        const data=await company.findByIdAndUpdate({_id:companyId,'isRead_profile.admin_id':adminId }, { $set: { 'isRead_profile.$.isRead': true } },
            { new: true })
          if(data){
            return data ||[]
          }
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

        const data=await candidate.findByIdAndUpdate({_id:candidateId,'isRead_profile.admin_id':adminId }, { $set: { 'isRead_profile.$.isRead': true } },
          { new: true })
        if(data){
          return data ||[]
        }

      }catch(error){
      console.log(error);
      }
    }