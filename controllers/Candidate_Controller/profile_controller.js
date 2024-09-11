const Joi=require('joi');
const axios=require('axios');
const mongoose=require('mongoose');
const candidate=require('../../models/Onboard_Candidate_Schema');
const basic_details=require('../../models/Basic_details_CandidateSchema')
const personal_details=require('../../models/Personal_details_candidateSchema');
const education_details=require('../../models/education_details_candidateSchema');
const work_details=require('../../models/work_details_candidate')

const WorkExperience = Joi.object({
  designation: Joi.string().required(),
  employee_type:Joi.string().required(),
  companyName: Joi.string().required(),
  location:Joi.string().required(),
  location_type: Joi.string().required(),
  reporting_structure:Joi.string().required(),
  current_workingStatus: Joi.boolean(),
  notice_period:Joi.number(),
  negotiation_day:Joi.number()
});

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

const OnboardCandidatePersonalDetails=Joi.object({
  gender: Joi.string().valid('Male', 'Female', 'Other'),
  age:Joi.number(),
  marriag_status:Joi.string().valid('Single','Married'),
  aadhar_number: Joi.number(),
  PAN: Joi.string().pattern(PAN_REGEX).messages({
    'string.pattern.base': 'PAN number is invalid'
  }),
  family_member:Joi.number(),
  father_name:Joi.string().min(3),
  son_name:Joi.string().min(3),
  spouse_profession:Joi.string()
})

const OnboardCandidateWorkDetails=Joi.object({
  current_ctc: Joi.number(),
  aspiring_position: Joi.string(),
  work_experience:Joi.string().min(1),
  career_highlight: Joi.string().min(5),
  recognation: Joi.string().min(5),
 skill:Joi.string()
})


exports.getProfilePercentageStatus = async (req, res) => {
    const { id } = req.params;
    try {
      const data = await candidate.findById(id)
        .populate('basic_details')
        .populate('education_details')
        .populate('work_details')
        .populate('personal_details');
  
      if (!data) {
        return res.status(404).json({ error: "Candidate not found" });
      }
  
      const basicFields = [
        'name', 'email', 'mobile', 'linkedIn'
      ];
      const educationFields = [
        'highest_education', 'board_represent', 'articles'
      ];
      const workFields = [
        'designation', 'company_name', 'industry', 'current_ctc', 'aspiring_position',
        'work_experience', 'current_report', 'last_reporting', 'career_highlight',
        'recognation', 'functions', 'preferred_location', 'current_location', 'resume'
      ];
      const personalFields = [
        'gender', 'age', 'marriag_status', 'aadhar_number', 'PAN',
        'family_member', 'father_name', 'son_name', 'spouse_profession'
      ];
  
      const calculateFilledFields = (details, fields) => {
        let filled = 0;
        fields.forEach(field => {
          if (details && details[field]) {
            filled++;
          }
        });
        return filled;
      };
      const totalBasicFields = basicFields.length;
      const filledBasicFields = calculateFilledFields(data.basic_details, basicFields);
  
      const totalEducationFields = educationFields.length;
      const filledEducationFields = calculateFilledFields(data.education_details, educationFields);
  
      const totalWorkFields = workFields.length;
      const filledWorkFields = calculateFilledFields(data.work_details, workFields);
  
      const totalPersonalFields = personalFields.length;
      const filledPersonalFields = calculateFilledFields(data.personal_details, personalFields);
  
      const totalFields = totalBasicFields + totalEducationFields + totalWorkFields + totalPersonalFields;
      const filledFields = filledBasicFields + filledEducationFields + filledWorkFields + filledPersonalFields;
  
      const profileCompletionPercentage = Math.round((filledFields / totalFields) * 100);
  
      return res.status(200).json({
        message: "Profile completion status retrieved successfully",
        profileCompletionPercentage
      });
  
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  };
  

  exports.AddSomeWorkexperience=async(req,res)=>{
    const {userId}=req.params;
    const {designation,employee_type,companyName,location,location_type,reporting_structure,current_workingStatus,notice_period,negotiation_day,start_date,end_date,End_posistion,CTC}=req.body;

    const { error } = WorkExperience.validate({designation,employee_type,companyName,location,location_type,reporting_structure,current_workingStatus,notice_period,negotiation_day});
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

    try{
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ error: 'Invalid candidate ID' });
      }

      const workDetailsData = {
        designation,employee_type,companyName,location,location_type,reporting_structure,current_workingStatus,notice_period,negotiation_day,start_date,end_date,End_posistion,CTC
      };
  
      const candidates = await candidate.findById(userId).populate('work_details');
  
      if (!candidates) {
        return res.status(404).json({ error: "Candidate not found" });
      }
  
      if (!candidates.work_details) {
        const newWorkDetails = new work_details();  
      newWorkDetails.Experience.push(workDetailsData); 
      const savedWorkDetails = await newWorkDetails.save(); 

      candidates.work_details = savedWorkDetails._id;
      await candidate.save(); 

      return res.status(201).json({ message: "Work details added successfully", work_details: savedWorkDetails });
      } else {
        console.log("this code is working")
        const updatedWorkDetails = await work_details.findByIdAndUpdate(
          candidates.work_details._id,
          { $push: { Experience: workDetailsData } }, 
          { new: true }
        );
  
        return res.status(200).json({ message: "Work experience added successfully", work_details: updatedWorkDetails });
      }
    }catch(error){
      console.log(error);
      return res.status(500).json({error:"Internal server error"});
    }
  }

  exports.getSingleWorkExp = async (req, res) => {
    const { user_id, exp_id } = req.params;
    
    try {
      const candidateData = await candidate.findById(user_id).populate('work_details')
      if (!candidateData) {
        return res.status(400).json({ error: "Candidate not available" });
      }

      const expData = candidateData?.work_details?.Experience.find(exp => exp._id.toString() === exp_id);
      if (!expData) {
        return res.status(404).json({ error: "Experience not found" });
      }
  
      return res.status(200).json(expData);
  
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  };

  exports.EditExp=async(req,res)=>{
    const {user_id,exp_id}=req.params;
    const {designation,employee_type,companyName,location,location_type,reporting_structure,current_workingStatus,notice_period,negotiation_day,start_date,end_date,End_posistion,CTC}=req.body;

    const { error } = WorkExperience.validate({designation,employee_type,companyName,location,location_type,reporting_structure,current_workingStatus,notice_period,negotiation_day});
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
    try{

      const candidate=await await candidate.findById(user_id);

      const updatedCandidate = await work_details.findOneAndUpdate(
        { _id:candidate.work_details, 'Experience._id': exp_id },
        {
          $set: {
            'Experience.$.designation': designation,
            'Experience.$.employee_type': employee_type,
            'Experience.$.companyName': companyName,
            'Experience.$.location': location,
            'Experience.$.location_type': location_type,
            'Experience.$.reporting_structure': reporting_structure,
            'Experience.$.current_workingStatus': current_workingStatus,
            'Experience.$.notice_period': notice_period,
            'Experience.$.negotiation_day': negotiation_day,
            'Experience.$.start_date': start_date,
            'Experience.$.end_date': end_date,
            'Experience.$.End_posistion': End_posistion,
            'Experience.$.CTC':CTC,
          },
        },
        { new: true }
      );

      if (updatedCandidate) {
        return res.status(200).json({ message: "Experience edited successfully" });
      } else {
        return res.status(400).json({ error: "Failed to edit experience" });
      }

    }catch(error){
      return res.status(500).json({error:"Internal server error"});
    }
  }


  exports.DeleteWorkDetails=async(req,res)=>{
    const {work_id,user_id}=req.params;
    try{
      const candidateData = await candidate.findOneAndUpdate(
        { _id: user_id }
      );

      const workDetails=await work_details.findOneAndUpdate(
        { _id: candidateData?.work_details },
        { $pull: { Experience: { _id: work_id } } },
        { new: true } 
      )
  
      if (!candidateData) {
        return res.status(404).json({ error: "Candidate or work detail not found" });
      }
  
      return res.status(200).json({
        message: "Work detail deleted successfully",
        candidateData
      });
    }catch(error){
      return res.status(500).json({error:"Internal server error"});
    }
  }


  exports.GetBasicDetails=async(req,res)=>{
    const {user_id}=req.params;
    try{

      const data = await candidate.findById({_id:user_id})
      .populate('basic_details')
      if(!data){
        return res.status(400).json({error:"Basic Details is empty"});
      }else{
        return res.status(200).send(data);
      }

    }catch(error){
      return res.status(500).json({error:"Internal server error"});
    }
  }

  exports.EditBasicDetails = async (req, res) => {
    const { user_id } = req.params;
    const { name, email, mobile, linkedIn, other_profile } = req.body;

    try {
        const candidates = await candidate.findById(user_id).populate('basic_details');

        if (!candidates || !candidates.basic_details) {
          const existEmail=await basic_details.findOne({email:email});
          if(existEmail){
           return res.status(400).json({error:"This email Id already exists in our data base"});
          }
   
          const existmobile=await basic_details.findOne({mobile:mobile});
          if(existmobile){
           return res.status(400).json({error:"This mobile number already exists in our data base"});
          }
          const candidateData = {
            name, email, mobile, linkedIn
          };
         const newBasicDetails = new basic_details(candidateData);
         const savedBasicDetails = await newBasicDetails.save();
     
         const newCandidate = new candidate({ basic_details: savedBasicDetails._id });
         const savedCandidate = await newCandidate.save();
     
         return res.status(201).json({ message: "Candidate details added successfully", candidate: savedCandidate });
        }

        const updateData = {
            name: name || candidate.basic_details.name,
            email: email || candidate.basic_details.email,
            mobile: mobile || candidate.basic_details.mobile,
            linkedIn: linkedIn || candidate.basic_details.linkedIn,
            other_profile: other_profile
        };
        const updatedBasicDetails = await basic_details.findByIdAndUpdate(
            candidates.basic_details._id,
            { $set: updateData },
            { new: true }
        );

        return res.status(200).json({
            message: "Basic details updated successfully",
            updatedBasicDetails
        });
    } catch (error) {
      console.log(error);
        return res.status(500).json({ error: "Internal server error" });
    }
};


exports.GetPersonlDetails=async(req,res)=>{
  const {user_id}=req.params;
  try{
    const data=await candidate.findById({_id:user_id}).populate('personal_details');
  if(!data){
    return res.status(400).json({error:"Empty personal details"});
  }
  return res.status(200).send(data);

  }catch(error){
    return res.status(500).json({error:"Internal server error"});
  }
}

exports.EditPersonalDetails = async (req, res) => {
  const { user_id } = req.params;
  const { gender, age, marriag_status, aadhar_number, PAN, family_member, father_name, son_name, spouse_profession, disability, disbility_name } = req.body;

  const { error } = OnboardCandidatePersonalDetails.validate({
    gender, age, marriag_status, aadhar_number, PAN, family_member, father_name, son_name, spouse_profession
  });
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    let candidateData = await candidate.findById(user_id).populate('personal_details');
    const panVerificationUrl = 'https://api.cashfree.com/verification/pan';
    const panRequestData = { pan: PAN };
    const panRequestOptions = {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-client-id': process.env.CASHFREE_CLIENT_ID,
        'x-client-secret': process.env.CASHFREE_CLIENT_SECRET
      },
      data: panRequestData
    };

    let panVerified = false;

    try {
      const panResponse = await axios(panVerificationUrl, panRequestOptions);
      const panResponseData = panResponse.data;
      panVerified = panResponse.status === 200 && panResponseData.valid;
    } catch (panError) {
      console.error("PAN verification failed:", panError);
      panVerified = false;
    }

    let aadharVerified = false;
    const aadharVerificationUrl = 'https://api.example.com/verification/aadhar';
    const aadharRequestData = { aadhar: aadhar_number };
    const aadharRequestOptions = {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-client-id': process.env.AADHAR_CLIENT_ID, // Replace with actual Aadhar API credentials
        'x-client-secret': process.env.AADHAR_CLIENT_SECRET
      },
      data: aadharRequestData
    };

    try {
      const aadharResponse = await axios(aadharVerificationUrl, aadharRequestOptions);
      const aadharResponseData = aadharResponse.data;
      aadharVerified = aadharResponse.status === 200 && aadharResponseData.valid;
    } catch (aadharError) {
      console.error("Aadhar verification failed:", aadharError);
      aadharVerified = false;
    }
    if (!candidateData) {
      // If the candidate does not exist, return an error
      return res.status(404).json({ error: "Candidate not found" });
    }
    if (!candidateData.personal_details) {
      // Create new personal details if the candidate doesn't exist
      const newPersonalDetails = new personal_details({
        gender,
        age,
        marriag_status,
        aadhar_number,
        PAN,
        family_member,
        father_name,
        son_name,
        spouse_profession,
        disability,
        disbility_name,
        Pan_verified_status: panVerified,
        Aadhar_verified_status: aadharVerified
      });

      const savedPersonalDetails = await newPersonalDetails.save();
      const newCandidate = new candidate({ _id: user_id, personal_details: savedPersonalDetails._id });
      const savedCandidate = await newCandidate.save();

      return res.status(201).json({ message: "Candidate created and personal details added successfully", candidate: savedCandidate });
    }
    const updateData = {
      gender: gender || candidateData.personal_details.gender,
      age: age || candidateData.personal_details.age,
      marriag_status: marriag_status || candidateData.personal_details.marriag_status,
      aadhar_number: aadhar_number || candidateData.personal_details.aadhar_number,
      PAN: PAN || candidateData.personal_details.PAN,
      family_member: family_member || candidateData.personal_details.family_member,
      father_name: father_name || candidateData.personal_details.father_name,
      son_name: son_name || candidateData.personal_details.son_name,
      spouse_profession: spouse_profession || candidateData.personal_details.spouse_profession,
      disability: disability || candidateData.personal_details.disability,
      disbility_name: disbility_name || candidateData.personal_details.disbility_name,
      Pan_verified_status: panVerified,
      Aadhar_verified_status: aadharVerified
    };
    const updatedPersonalDetails = await personal_details.findByIdAndUpdate(
      candidateData.personal_details._id,
      { $set: updateData },
      { new: true }
    );

    return res.status(200).json({
      message: "Personal details updated successfully",
      updatedPersonalDetails
    });

  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};



exports.GetworkDetails=async(req,res)=>{
  const {user_id}=req.params;
  try{
    const data=await candidate.findById({_id:user_id}).populate('work_details');
    if(!data){
      return res.status(400).json({error:"Emptt work details"});
    }
    return res.status(200).send(data);
  }catch(error){
    return res.status(500).json({error:"Internal sever error"});
  }
}

exports.EditWorkDetails = async (req, res) => {
  const { user_id } = req.params;
  const { current_ctc, aspiring_position, work_experience, career_highlight, recognation, skill } = req.body;

  const { error } = OnboardCandidateWorkDetails.validate({
    current_ctc, aspiring_position, work_experience, career_highlight, recognation, skill
  });

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      return res.status(400).json({ error: 'Invalid candidate ID' });
    }

    // Check if a resume file is uploaded
    if (!req.file) {
      return res.status(400).json({ error: "Please upload a resume file" });
    }

    const workDetailsData = {
      current_ctc,
      aspiring_position,
      work_experience,
      career_highlight,
      recognation,
      skill,
      resume: req.file.filename
    };

    const candidates = await candidate.findById(user_id).populate('work_details');

    if (!candidates) {
      // If the candidate does not exist, return an error
      return res.status(404).json({ error: "Candidate not found" });
    }

    if (!candidates.work_details) {
      // If the candidate exists but does not have work details, create new work details
      const newWorkDetails = new work_details(workDetailsData);
      const savedWorkDetails = await newWorkDetails.save();

      // Associate the new work details with the existing candidate
      candidates.work_details = savedWorkDetails._id;
      await candidates.save();

      return res.status(201).json({ message: "Work details added successfully", work_details: savedWorkDetails });
    } else {
      // If the candidate already has work details, update them
      const updatedWorkDetails = await work_details.findByIdAndUpdate(
        candidates.work_details._id,
        { $set: workDetailsData },
        { new: true }
      );

      return res.status(200).json({ message: "Work details updated successfully", work_details: updatedWorkDetails });
    }

  } catch (error) {
    console.error("Error updating work details:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};


exports.GetEducationDetails=async(req,res)=>{
  const {user_id}=req.params;
  try{
const data=await candidate.findById(user_id).populate('education_details');
if(data){
  return res.status(200).send(data);
}else{
  return res.status(400).json({error:"Education details not found"});
}

  }catch(error){
    return res.status(500).json({error:"Internal server error"});
  }
}


exports.AddNewAducation = async (req, res) => {
  const { user_id } = req.params;
  const {
    highest_education,
    board_represent,
    articles,
    school,
    degree,
    Field_study,
    start_date,
    end_date,
    grade,
    description
  } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      return res.status(400).json({ error: 'Invalid candidate ID' });
    }

    const candidateData = await candidate.findById(user_id).populate('education_details');
    if (!candidateData) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    const newEducation = {
      school,
      degree,
      Field_study,
      start_date,
      end_date,
      grade,
      description
    };

    if(!candidateData.education_details){
      const newEducationDetails = new education_details(newEducation);
      const savedEducationDetails = await newEducationDetails.save();
  
      const newCandidate = new candidate({education_details: savedEducationDetails._id });
      const savedCandidate = await newCandidate.save();
  
      return res.status(201).json({ message: "Education added successfully", candidate: savedCandidate });
    }

    const updatedEducationDetails = await education_details.findByIdAndUpdate(
      candidateData.education_details._id,
      {
        highest_education,
        board_represent,
        articles,
        $addToSet: { Education: newEducation }
      },
      { new: true } 
    );

    candidateData.education_details = updatedEducationDetails._id;
    await candidateData.save();

    return res.status(200).json({
      message: "Education details added successfully",
      educationDetails: updatedEducationDetails
    });

  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: "Internal server error" });
  }
};


exports.DeleteEducation=async(req,res)=>{
  const {user_id,education_id}=req.params;
  try{

    const candidateData = await candidate.findById(user_id).populate('education_details');
    const updatedEducationDetails = await education_details.findByIdAndDelete(
      candidateData.education_details._id,
      { $pull: { Education: { _id: education_id } } },
      { new: true } 
    );

    if (!updatedEducationDetails) {
      return res.status(404).json({ error: "Candidate or work detail not found" });
    }

    return res.status(200).json({
      message: "Work detail deleted successfully",
      candidateData
    });

  }catch(error){
    return res.status(500).json({error:"Iternal server error"});
  }
}