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
  industry:Joi.string(),
  current_ctc: Joi.number(),
  aspiring_position: Joi.string(),
  work_experience:Joi.string().min(1),
  career_highlight: Joi.string().min(5),
  recognation: Joi.string().min(5),
  functions:Joi.string(),
  preferred_location:Joi.string(),
  current_location:Joi.string(),
  country:Joi.string()
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

      // Fields to be checked
      const basicFields = [
        'name', 'email', 'mobile', 'linkedIn'
      ];
      const educationFields = [
        'highest_education', 'board_represent'
      ];
      const workFields = [
           'industry', 'aspiring_position',
        'work_experience','career_highlight',
         'functions', 'preferred_location', 'current_location', 'resume','skill'
      ];
      const personalFields = [
        'gender', 'age', 'marriag_status', 'aadhar_number', 'PAN',
        'family_member', 'spouse_profession','Pan_verified_status','Aadhar_verified_status','location','country'
      ];

      const calculateFilledFields = (details, fields) => {
          let filled = 0;
          if (!details) return filled;

          fields.forEach(field => {
              if (details[field] !== undefined && details[field] !== null && details[field] !== ''&&details[field] !== false) {
                  filled++;
              } else {
                  // console.log(`Field "${field}" is not filled or invalid.`);
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
      const starRating = data.Interviewed.map((temp) => temp.rating);
      const totalRating = starRating.reduce((acc, rating) => acc + rating, 0);
      const averageRating = starRating.length > 0 ? totalRating / starRating.length : 0;
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const isGoogleDriveLink = (url) => url && (url.includes('drive.google.com') || url.includes('docs.google.com'));
            const profileUrl = data?.profile
                ? (isGoogleDriveLink(data?.profile) ? data?.profile : `${baseUrl}/${data?.profile.replace(/\\/g, '/')}`)
                : null;
      return res.status(200).json({
          message: "Profile completion status retrieved successfully",
          profileCompletionPercentage: profileCompletionPercentage >= 0 ? profileCompletionPercentage : 0,data,averageRating,profileUrl
      });

  } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
  }
};

exports.AddSummaryToCandidate=async(req,res)=>{
  const {userId}=req.params;
  const {summary}=req.body
  try{
    if(!req.file){
      return res.status(400).json({error:"Please upload profile image"}); 
    }
    const data=await candidate.findByIdAndUpdate(userId,{profile:req.file?.path,summary})
    if(data){
      return res.status(200).json({message:"Profile updated"});
    }else{
      return res.status(400).json({error:"profile is not updated"});
    }
  }catch(error){
    return res.status(500).json({error:"Internal server error"});
  }
}

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
      newWorkDetails.custom_id=candidates?.custom_id;
      const savedWorkDetails = await newWorkDetails.save(); 

      candidates.work_details = savedWorkDetails._id;
      await candidates.save(); 

      return res.status(201).json({ message: "Work details added successfully", work_details: savedWorkDetails });
      } else {
        const updatedWorkDetails = await work_details.findByIdAndUpdate(
          candidates.work_details._id,
          { $push: { Experience: workDetailsData } }, 
          { new: true }
        );
  
        return res.status(200).json({ message: "Work experience added successfully", work_details: updatedWorkDetails });
      }
    }catch(error){
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

exports.AadharVerification=async(req,res)=>{
  const {aadhar_number}=req.body;
  const apiUrl = 'https://sandbox.cashfree.com/verification/offline-aadhaar/otp';
  const requestData = {
    aadhaar_number: aadhar_number,
  };

  const requestOptions = {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'x-client-id': process.env.CASHFREE_CLIENT_ID,
      'x-client-secret': process.env.CASHFREE_CLIENT_SECRET,
    },
    body: JSON.stringify(requestData),
  };

  try {
    const response = await fetch(apiUrl, requestOptions);
    const responseData = await response.json();
    if (responseData.status === "SUCCESS") {
      const output = { status: true, responseData: responseData };
      res.status(200).json(output);
    } else {
      const output = { status: false, responseData: responseData };
      res.status(400).json(output);
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: false, error: 'Internal Server Error' });
  }
}

exports.aadharOtpVerification = async (req, res) => {
  const { userId } = req.params;
  const { otp, ref_id,aadhar_number} = req.body;
  const apiUrl = 'https://sandbox.cashfree.com/verification/offline-aadhaar/verify';
  
  const requestData = {
    otp: otp,
    ref_id: ref_id,
  };

  const requestOptions = {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'x-client-id': process.env.CASHFREE_CLIENT_ID,
      'x-client-secret': process.env.CASHFREE_CLIENT_SECRET,
    },
    body: JSON.stringify(requestData),
  };

  try {
    const response = await fetch(apiUrl, requestOptions);

    const responseData = await response.json();
    if (responseData.status === 'VALID') {
      const candidateData = await candidate.findById(userId);

      if (!candidateData) {
        return res.status(404).json({ status: false, error: 'Candidate not found' });
      }

      let updatedPersonalDetails;
      
      if (!candidateData.personal_details) {
        const newPersonalDetails = new personal_details({
          Aadhar_verified_status: true,
          aadhar_number:aadhar_number
        });
        const savedPersonalDetails = await newPersonalDetails.save();

        candidateData.personal_details = savedPersonalDetails._id;
        await candidateData.save();

        updatedPersonalDetails = savedPersonalDetails;
      } else {
        updatedPersonalDetails = await personal_details.findByIdAndUpdate(
          candidateData.personal_details._id,
          { $set: { Aadhar_verified_status: true,aadhar_number:aadhar_number} },
          { new: true }
        );
      }

      return res.status(200).json({ status: true, responseData, updatedPersonalDetails });
    } else {
      return res.status(400).json({ status: false, responseData });
    }
  } catch (error) {
    return res.status(500).json({ status: false, error: 'Internal server error' });
  }
};

exports.PanKYCverification=async(req,res)=>{
  const {userId}=req.params;
  const {PAN,name}=req.body;
  const apiUrl = 'https://sandbox.cashfree.com/verification/pan';
  const requestData = {
    pan: PAN,
    name:name
  };

  const requestOptions = {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'x-client-id': process.env.CASHFREE_CLIENT_ID,
      'x-client-secret': process.env.CASHFREE_CLIENT_SECRET
    },
    body: JSON.stringify(requestData)
  };
  try{
    const response = await fetch(apiUrl, requestOptions);
    const responseData = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ status: false, error: responseData });
    }

    const output = { status: true, responseData: responseData };

    if (responseData.valid === true&& responseData.registered_name.toLowerCase() == name.toLowerCase()) {
      const candidateData = await candidate.findById(userId);

      if (!candidateData) {
        return res.status(404).json({ status: false, error: 'Candidate not found' });
      }

      let updatedPersonalDetails;
      
      if (!candidateData.personal_details) {
        const newPersonalDetails = new personal_details({
          Pan_verified_status: true,
          PAN:PAN
        });
        const savedPersonalDetails = await newPersonalDetails.save();

        candidateData.personal_details = savedPersonalDetails._id;
        await candidateData.save();

        updatedPersonalDetails = savedPersonalDetails;
      } else {
        updatedPersonalDetails = await personal_details.findByIdAndUpdate(
          candidateData.personal_details._id,
          { $set: { Pan_verified_status: true,PAN:PAN} },
          { new: true }
        );
      }

      return res.status(200).json({ status: true, responseData, updatedPersonalDetails });
    } else {
      res.status(400).json({ status: false, responseData: responseData });
    }
  }catch(error){
    return res.status(500).json({error:"Intrnal server error"});
  }
}


exports.EditPersonalDetails = async (req, res) => {
  const { user_id } = req.params;
  const { gender, age, marriag_status, aadhar_number, PAN, family_member, father_name, son_name, spouse_profession, disability, disbility_name,location,country} = req.body;

  const { error } = OnboardCandidatePersonalDetails.validate({
    gender, age, marriag_status, aadhar_number, PAN, family_member, father_name, son_name, spouse_profession
  });
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    let candidateData = await candidate.findById(user_id).populate('personal_details');

    if (!candidateData) {
      return res.status(404).json({ error: "Candidate not found" });
    }
    if (!candidateData.personal_details) {
      const newPersonalDetails = new personal_details({
        custom_id:candidateData?.custom_id,
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
        location,
        country
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
      country:country|| candidateData.personal_details.country,
      location:location|| candidateData.personal_details.location
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
  const { industry,current_ctc, aspiring_position, work_experience, career_highlight, recognation,functions,preferred_location,current_location,country,skill} = req.body;

  const { error } = OnboardCandidateWorkDetails.validate({
    industry,current_ctc, aspiring_position, work_experience, career_highlight, recognation,functions,preferred_location,current_location,country
  });

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      return res.status(400).json({ error: 'Invalid candidate ID' });
    }

    // Check if a resume file is uploaded
    // if (!req.file) {
    //   return res.status(400).json({ error: "Please upload a resume file" });
    // }


    const candidates = await candidate.findById(user_id).populate('work_details');
    const workDetailsData = {
      custom_id:candidate?.custom_id,
      industry,
      current_ctc,
      aspiring_position,
      work_experience,
      career_highlight,
      recognation,
      skill,
      resume: req?.file?.path,
      functions,preferred_location,current_location,country
    };

    if (!candidates) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    if (!candidates.work_details) {
      const newWorkDetails = new work_details(workDetailsData);
      const savedWorkDetails = await newWorkDetails.save();
      candidates.work_details = savedWorkDetails._id;
      await candidates.save();

      return res.status(201).json({ message: "Work details added successfully", work_details: savedWorkDetails });
    } else {
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
    const candidateData = await candidate.findById(user_id);
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
      description,
      certificate:req?.file?.path
    };

    if (!candidateData.education_details) {
      const newEducationDetails = new education_details({
        Education: [newEducation], 
        custom_id:candidateData?.custom_id
      });

      const savedEducationDetails = await newEducationDetails.save();

      const updatedCandidate = await candidate.findByIdAndUpdate(
        user_id,
        { education_details: savedEducationDetails._id },
        { new: true }
      );

      return res.status(201).json({
        message: "Education added successfully",
        candidate: updatedCandidate
      });
    }

    const updatedEducationDetails = await education_details.findByIdAndUpdate(
      candidateData.education_details._id,
      {
        $push: { Education: newEducation } 
      },
      { new: true }
    );

    return res.status(200).json({
      message: "Education details updated successfully",
      educationDetails: updatedEducationDetails
    });

  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};


exports.EditEducationDetails=async(req,res)=>{
  const {user_id}=req.params;
  const {highest_education,board_represent,articles,certificates}=req.body;
  try{

    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      return res.status(400).json({ error: 'Invalid candidate ID' });
    }
    const certificatesArray = certificates?.map((certificate, index) => {
      const fileFieldName = `certificates[${index}][image]`;
      const file = req.files[fileFieldName] ? req.files[fileFieldName][0] : null;
      return {
        Certificate: certificate.certificateName,
        image: file ? file.path : null,
      };
    });

    const candidateData = await candidate.findById(user_id);
    if (!candidateData) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    if (!candidateData.education_details) {
      const newEducationDetails = new education_details({
        custom_id: candidateData?.custom_id,
        highest_education,
        board_represent,
        articles,
        certificates: certificatesArray || [] 
      });

      const savedEducationDetails = await newEducationDetails.save();

      // Update the candidate's document to link the new education details
      const updatedCandidate = await candidate.findByIdAndUpdate(
        user_id,
        { education_details: savedEducationDetails._id }, // Link the education details
        { new: true }
      );

      return res.status(201).json({
        message: "Education added successfully",
        candidate: updatedCandidate
      });
    }

    const updatedEducationDetails = await education_details.findByIdAndUpdate(
      candidateData.education_details._id,
      {
        highest_education,
        board_represent,
        articles,
        certificates: certificatesArray || [],
      },
      { new: true }
    );

    return res.status(200).json({
      message: "Education details updated successfully",
      educationDetails: updatedEducationDetails
    });

  }catch(error){
    return res.status(500).json({error:"Internal server error"});
  }
}


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


exports.GetAllCompanyReview = async (req, res) => {
  const { user_id } = req.params;
  try {
    if(!user_id){
      return res.status(400).json({error:"Please provide user id"});
    }
      const Id = new mongoose.Types.ObjectId(user_id);
      const currentDate = new Date(); 
      const data = await candidate.aggregate([
          { $match: { _id: Id } },
          { $unwind: '$Interviewed' },
          {
              $lookup: {
                  from: 'companies',
                  localField: 'Interviewed.company_id',
                  foreignField: '_id',
                  as: 'CompanyDetails'
              }
          },
          {
              $unwind: {
                  path: '$CompanyDetails',
                  preserveNullAndEmptyArrays: true
              }
          },
          {
              $project: {
                  'Interviewed.feedBack': 1,
                  'CompanyDetails.company_name': 1,
                  'CompanyDetails.profile': 1,
                  'CompanyDetails.verified_batch': {
                      $filter: {
                          input: '$CompanyDetails.verified_batch',
                          as: 'batch',
                          cond: { $gt: ['$$batch.ExpireDate', currentDate] } 
                      }
                  }
              }
          },
      ]);

      const baseUrl = `${req.protocol}://${req.get('host')}`;
    const isGoogleDriveLink = (url) => {
      return url && (url.includes('drive.google.com') || url.includes('docs.google.com'));
    };

    const formattedData = data.map((item) => {
      return {
        ...item,
        profileUrl: item.CompanyDetails?.profile
          ? (isGoogleDriveLink(item.CompanyDetails.profile)
              ? item.CompanyDetails.profile
              : `${baseUrl}/${item.CompanyDetails.profile.replace(/\\/g, '/')}`)
          : null
      };
    });

    if (formattedData.length > 0) {
      return res.status(200).send(formattedData);
    } else {
      return res.status(404).json({ message: "No reviews found for this Candidate." });
    }
  } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
  }
};
