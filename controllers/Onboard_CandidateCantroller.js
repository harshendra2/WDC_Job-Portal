const Joi=require("joi");
const candidate=require("../models/Onboard_Candidate_Schema");
const basic_details=require("../models/Basic_details_CandidateSchema");
const personal_details=require("../models/Personal_details_candidateSchema");
const work_details=require("../models/work_details_candidate");
const education_details=require("../models/education_details_candidateSchema");

const OnboardCandidate = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    mobile: Joi.string().min(10).required(),
    linkedIn: Joi.string().min(15).required(),
    gender: Joi.string().valid('Male', 'Female', 'Other').required(), 
    designation: Joi.string().min(3).required(),
    company_name: Joi.string().min(5).required(),
    industry: Joi.string().min(3).required(),
    current_ctc: Joi.string().min(1).required(),
    current_location: Joi.string().min(5).required(),
    preferred_location: Joi.string().min(5).required(),
    position: Joi.string().min(5).required(),
    recognation: Joi.string().min(5).required()
  });

  const OnboardCandidatePersonalDetails=Joi.object({
    marriag_status:Joi.string().valid('Single','Married').required(),
    family_member:Joi.string().min(1).required(),
    father_name:Joi.string().min(3).required(),
    son_name:Joi.string().min(3).required(),
    spouse_profession:Joi.string().required()
  })

  const OnboardCandidateWorkDetails=Joi.object({
    work_experience:Joi.string().min(1).required(),
    age:Joi.string().min(2).required(),
    functions:Joi.string().min(5).required(),
    articles:Joi.string().min(5),
    certificate:Joi.string().min(5)
  })

  const OnboardCandidateEducationDetails=Joi.object({
    career_details:Joi.string().min(5).required(),
    highest_education:Joi.string().min(5).required(),
    board_represent:Joi.string().min(5).required(),
    current_report:Joi.string().min(5).required(),
    last_reporting: Joi.string().min(5).required()
  })
  
  exports.createBasicDetaileCandidate = async (req, res) => {
    const { name, email, mobile, linkedIn, gender, designation, company_name, industry, current_ctc, current_location, preferred_location, position, recognation } = req.body;
  
    const { error } = OnboardCandidate.validate({
      name, email, mobile, linkedIn, gender, designation, company_name, industry, current_ctc, current_location, preferred_location, position, recognation
    });
  
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
  
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Please upload a file" });
      }
  
      const candidateData = {
        name, email, mobile, linkedIn, gender, designation, company_name, industry, current_ctc, current_location, preferred_location, position, recognation,
        resume: req.file.path 
      };
  
      const newBasicDetails = new basic_details(candidateData);
      const savedBasicDetails = await newBasicDetails.save();
  
      const newCandidate = new candidate({ basic_details: savedBasicDetails._id });
      const savedCandidate = await newCandidate.save();
  
      return res.status(201).json({ message: "Candidate details and file uploaded successfully", candidate: savedCandidate });
  
    } catch (error) {
      console.error('Error during candidate creation:', error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  };


  exports.createPersonalDetailsCandidate = async (req, res) => {
    const { marriag_status, family_member, father_name, son_name, spouse_profession,id} = req.body;
  
    const { error } = OnboardCandidatePersonalDetails.validate({
      marriag_status, family_member, father_name, son_name, spouse_profession
    });
  
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
  
    try {
      const CandidateData = { marriag_status, family_member, father_name, son_name, spouse_profession };
      
      const newPersonalDetails = new personal_details(CandidateData);
      const savedPersonalDetails = await newPersonalDetails.save();
          
      const updatedCandidate = await candidate.findByIdAndUpdate(
        id, 
        { personal_details: savedPersonalDetails._id }, 
        { new: true }
      );
  
      if (updatedCandidate) {
        return res.status(201).json({ message: "Personal Details added successfully", candidate: updatedCandidate });
      } else {
        return res.status(404).json({ error: "Candidate not found" });
      }
  
    } catch (error) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  };


  exports.createWorkDetailsCandidate=async(req,res)=>{
    const {work_experience,age,functions,articles,certificate,id}=req.body;

    const { error } = OnboardCandidateWorkDetails.validate({
      work_experience,age,functions,articles,certificate
    });
  
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
  
    try{

      const Candidatedata={work_experience,age,functions,articles,certificate};
      const newWorkDetails = new work_details(Candidatedata);
      const savedWorkDetails = await newWorkDetails.save();
          
      const updatedCandidate = await candidate.findByIdAndUpdate(
        id, 
        { work_details: savedWorkDetails._id }, 
        { new: true }
      );
  
      if (updatedCandidate) {
        return res.status(201).json({ message: "Work Details added successfully", candidate: updatedCandidate });
      } else {
        return res.status(404).json({ error: "Candidate not found" });
      }


    }catch(error){
      return res.status(500).json({error:"Internal Server Error"});
    }
  }


  exports.createEducationDetailsCandidate=async(req,res)=>{
    const {career_details,highest_education,board_represent,current_report,last_reporting,id}=req.body;

    const { error } = OnboardCandidateEducationDetails.validate({
      career_details,highest_education,board_represent,current_report,last_reporting
    });
  
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    try{

      const Candidatedata={career_details,highest_education,board_represent,current_report,last_reporting};
      const newEducationDetails = new education_details(Candidatedata);
      const savededucationDetails = await newEducationDetails.save();
          
      const updatedCandidate = await candidate.findByIdAndUpdate(
        id, 
        { education_details: savededucationDetails._id }, 
        { new: true }
      );
  
      if (updatedCandidate) {
        return res.status(201).json({ message: "Candidate added successfully", candidate: updatedCandidate });
      } else {
        return res.status(404).json({ error: "Candidate not found" });
      }

    }catch(error){
      return res.status(500).json({error:"Internal Server Error"});
    }
  }