const Joi=require("joi");
const XLSX = require('xlsx');
const mongoose = require('mongoose');
const candidate=require("../../models/Onboard_Candidate_Schema");
const basic_details=require("../../models/Basic_details_CandidateSchema");
const personal_details=require("../../models/Personal_details_candidateSchema");
const work_details=require("../../models/work_details_candidate");
const education_details=require("../../models/education_details_candidateSchema");

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

const OnboardCandidate = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    mobile: Joi.number().min(10).required(),
    linkedIn: Joi.string().min(10).required(), 
  });

  const OnboardCandidatePersonalDetails=Joi.object({
    gender: Joi.string().valid('Male', 'Female', 'Other').required(),
    age:Joi.number().required(),
    marriag_status:Joi.string().valid('Single','Married').required(),
    preferred_location: Joi.string().min(5).required(),
    current_location: Joi.string().min(5).required(),
    aadhar_number: Joi.number().required(),
    PAN: Joi.string().pattern(PAN_REGEX).required().messages({
      'string.pattern.base': 'PAN number is invalid'
    }),
    family_member:Joi.number().required(),
    father_name:Joi.string().min(3).required(),
    son_name:Joi.string().min(3).required(),
    spouse_profession:Joi.string().required()
  })

  const OnboardCandidateWorkDetails=Joi.object({
    designation: Joi.string().min(3).required(),
    company_name: Joi.string().min(5).required(),
    industry: Joi.string().min(3).required(),
    current_ctc: Joi.number().required(),
    aspiring_position: Joi.string().required(),
    work_experience:Joi.string().min(1).required(),
    current_report:Joi.string().min(5).required(),
    last_reporting: Joi.string().min(5).required(),
    career_highlight: Joi.string().min(5).required(),
    recognation: Joi.string().min(5).required(),
    functions:Joi.string().min(5).required(),
  })

  const OnboardCandidateEducationDetails=Joi.object({
    highest_education:Joi.string().min(5).required(),
    board_represent:Joi.string().min(5).required(),
    articles:Joi.string().min(5),
    certificate:Joi.string().min(5)
  })
  
  exports.createBasicDetaileCandidate = async (req, res) => {
    const { name, email, mobile, linkedIn} = req.body;
  
    const { error } = OnboardCandidate.validate({
      name, email, mobile, linkedIn
    });
  
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
  
    try {
     
  
      const candidateData = {
        name, email, mobile, linkedIn
      };
  
      const newBasicDetails = new basic_details(candidateData);
      const savedBasicDetails = await newBasicDetails.save();
  
      const newCandidate = new candidate({ basic_details: savedBasicDetails._id });
      const savedCandidate = await newCandidate.save();
  
      return res.status(201).json({ message: "Candidate details added successfully", candidate: savedCandidate });
  
    } catch (error) {
      console.error('Error during candidate creation:', error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  };


  exports.createPersonalDetailsCandidate = async (req, res) => {
    const {gender,age,marriag_status,preferred_location,current_location,aadhar_number,PAN, family_member, father_name, son_name, spouse_profession,id} = req.body;
  
    const { error } = OnboardCandidatePersonalDetails.validate({
      gender,age,marriag_status,preferred_location,current_location,aadhar_number,PAN,family_member, father_name, son_name, spouse_profession
    });
  
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
  
    try {
      const CandidateData = {  gender,age,marriag_status,preferred_location,current_location,aadhar_number,PAN,family_member, father_name, son_name, spouse_profession};
      
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
    const {designation,company_name,industry,current_ctc,aspiring_position,work_experience,current_report,last_reporting,career_highlight,recognation,functions,id}=req.body;

    const { error } = OnboardCandidateWorkDetails.validate({
      designation,company_name,industry,current_ctc,aspiring_position,work_experience,current_report,last_reporting,career_highlight,recognation,functions
    });
  
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
  
    try{

      const Candidatedata={designation,company_name,industry,current_ctc,aspiring_position,work_experience,current_report,last_reporting,career_highlight,recognation,functions};
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
    const {highest_education,board_represent,articles,certificate,id}=req.body;

    const { error } = OnboardCandidateEducationDetails.validate({
      highest_education,board_represent,articles,certificate
    });
  
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    try{

      if (!req.file) {
        return res.status(400).json({ error: "Please upload a file" });
      }
      // Construct the file URL
    const fileUrl = `${req.protocol}://${req.get("host")}/Images/${req.file.filename}`;
      const Candidatedata={highest_education,board_represent,articles,certificate,resume:fileUrl};
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

  exports.getAllCandidate = async (req, res) => {
    try {
      const data = await candidate.aggregate([
        {
          $lookup: {
            from: 'candidate_basic_details',
            localField: 'basic_details',
            foreignField: '_id',
            as: 'basic_details'
          }
        },
        {
          $lookup: {
            from: 'candidate_personal_details',
            localField: 'personal_details',
            foreignField: '_id',
            as: 'personal_details'
          }
        },
        {
          $lookup: {
            from: 'candidate_work_details',
            localField: 'work_details',
            foreignField: '_id',
            as: 'work_details'
          }
        },
        {
          $lookup: {
            from: 'candidate_education_details',
            localField: 'education_details',
            foreignField: '_id',
            as: 'education_details'
          }
        }
      ]);
      if(data){
      return res.status(200).send(data);
      }
    } catch (error) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  };


  exports.getbasicDetails = async (req, res) => {
    const { id } = req.params;
  
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid candidate ID' });
      }
  
      const objectId = new mongoose.Types.ObjectId(id); 
      const data = await candidate.aggregate([
        { $match: { _id: objectId } },
        {
          $lookup: {
            from: 'candidate_basic_details',
            localField: 'basic_details',
            foreignField: '_id',
            as: 'basic_details'
          }
        }
      ]);
  
      if (data && data.length > 0) {
        return res.status(200).json(data[0]);
      } else {
        return res.status(404).json({ error: 'This data is not available in our database' });
      }
    } catch (error) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  };


  exports.editBasicDetails = async (req, res) => {
    const { id } = req.params;
    const {name, email, mobile, linkedIn} = req.body;
  
    const { error } = OnboardCandidate.validate({
      name, email, mobile, linkedIn
    });
  
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
  
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid candidate ID' });
      }
  
      const candidateData = {
        name, email, mobile, linkedIn
      };
  
      const updatedData = await basic_details.findByIdAndUpdate(id, candidateData, { new: true });
  
      if (updatedData) {
        return res.status(200).json({ message: "Basic Details Updated Successfully", data: updatedData });
      } else {
        return res.status(404).json({ error: "Basic Details is not updated" });
      }
    } catch (error) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  };


  exports.getPersonalDetails=async(req,res)=>{
    const {id}=req.params;
    try{
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid candidate ID' });
      }

      const objectId = new mongoose.Types.ObjectId(id); 
      const data=await candidate.aggregate([
        { $match: { _id:objectId} },
        {$lookup: {
          from: 'candidate_personal_details',
          localField: 'personal_details',
          foreignField: '_id',
          as: 'personal_details'
          }
        }
      ])

      if (data && data.length > 0) {
        return res.status(200).json(data[0]);
      } else {
        return res.status(404).json({ error: 'This data is not available in our database' });
      }

    }catch(error){
      return res.status(500).json({error:"Internal Server error"});
    }
  }

  exports.editPersonalDetails=async(req,res)=>{
    const {id}=req.params;
    const {gender,age,marriag_status,preferred_location,current_location, family_member, father_name, son_name, spouse_profession}=req.body;
    const { error } = OnboardCandidatePersonalDetails.validate({
      gender,age,marriag_status,preferred_location,current_location, family_member, father_name, son_name, spouse_profession
    });
  
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
  
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid candidate ID' });
      }
  
      const candidateData = {
        gender,age,marriag_status,preferred_location,current_location, family_member, father_name, son_name, spouse_profession
      };
  
      const updatedData = await personal_details.findByIdAndUpdate(id, candidateData, { new: true });
  
      if (updatedData) {
        return res.status(200).json({ message: "Personal Details Updated Successfully", data: updatedData });
      } else {
        return res.status(404).json({ error: "Personal Details is not updated" });
      }
    }catch(error){
      return res.status(500).json({error:"Internal Server Error"});
    }
  }

  exports.getWorkdetails=async(req,res)=>{
    const {id}=req.params;
    try{
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid candidate ID' });
      }

      const objectId = new mongoose.Types.ObjectId(id); 
      const data=await candidate.aggregate([
        { $match: { _id:objectId} },
        {$lookup: {
          from: 'candidate_work_details',
            localField: 'work_details',
            foreignField: '_id',
            as: 'work_details'
          }
        }
      ])

      if (data && data.length > 0) {
        return res.status(200).json(data[0]);
      } else {
        return res.status(404).json({ error: 'This data is not available in our database' });
      }

    }catch(error){
      return res.status(500).json({error:"Internal Server error"});
    }
  }

  exports.editWorkDetails=async(req,res)=>{
    const {id}=req.params;
    const {designation,company_name,industry,current_ctc,aspiring_position,work_experience,current_report,last_reporting,career_highlight,recognation,functions}=req.body;
    const { error } = OnboardCandidateWorkDetails.validate({
      designation,company_name,industry,current_ctc,aspiring_position,work_experience,current_report,last_reporting,career_highlight,recognation,functions
    });
  
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    try{

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid candidate ID' });
      }
  
      const candidateData = {
        designation,company_name,industry,current_ctc,aspiring_position,work_experience,current_report,last_reporting,career_highlight,recognation,functions
      };
  
      const updatedData = await work_details.findByIdAndUpdate(id, candidateData, { new: true });
  
      if (updatedData) {
        return res.status(200).json({ message: "Work Details Updated Successfully", data: updatedData });
      } else {
        return res.status(404).json({ error: "Work Details is not updated" });
      }
      
    }catch(error){
      return res.status(500).json({error:"Internal Server error"});
    }
  }


  exports.getEducationData=async(req,res)=>{
    const {id}=req.params;
    try{

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid candidate ID' });
      }

      const objectId = new mongoose.Types.ObjectId(id); 
      const data=await candidate.aggregate([
        { $match: { _id:objectId} },
        {$lookup: {
          from: 'candidate_education_details',
          localField: 'education_details',
          foreignField: '_id',
          as: 'education_details'
          }
        }
      ])

      if (data && data.length > 0) {
        return res.status(200).json(data[0]);
      } else {
        return res.status(404).json({ error: 'This data is not available in our database' });
      }

    }catch(error){
      return res.status(500).json({error:"Internal Server error"});
    }
  }

  exports.editEducationDetails=async(req,res)=>{
    const {id}=req.params;
    const {highest_education,board_represent,articles,certificate}=req.body;

    const { error } = OnboardCandidateEducationDetails.validate({
      highest_education,board_represent,articles,certificate
    });
  
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    try{
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid candidate ID' });
      }
  
      const candidateData = {
        highest_education,board_represent,articles,certificate
      };
      if (!req.file) {
        return res.status(400).json({ error: "Please upload a file" });
      }else{
        candidateData.resume=req.file
      }
  
      const updatedData = await education_details.findByIdAndUpdate(id, candidateData, { new: true });
  
      if (updatedData) {
        return res.status(200).json({ message: "Education Details Updated Successfully", data: updatedData });
      } else {
        return res.status(404).json({ error: "Education Details is not updated" });
      }
      

    }catch(error){
      return res.status(500).json({error:"Internal Server Error"});
    }
  }


  // download and upload Excel Sheets

  exports.DownloadExcelTemplete=async(req,res)=>{
    try{
      const data = [
        {Name: '',Email: '',Mobile_No: '',linkedIn_Profile_Link:'',Gender:'',Age:'',Marriage_Status:'',Preffered_location:'',Current_location:'',Member_In_Family:'',Name_of_Father:'',Son_Name:'',Spouse_profession:'',Designation:'',Company_name:'',Industry:'',Current_CTC:'',Role:'',Total_experience:'',Functions:'',Current_reporting_structure:'',Last_reposrting_Structure:'',Career_Highlight:'',Recognation:'',Education:'',Board_Represent_Name:'',Articles:'',Certificate:''} // Example headers/fields
    ];

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="template.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(excelBuffer);

    }catch(error){
      return res.status(500).json({error:"Internal Server error"});
    }
  }


  exports.uploadExcelFile=async(req,res)=>{
    try{
      const workbook = XLSX.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    
    for (const row of sheetData) {
      const basicDetails = {
        name: row.Name,
        email: row.Email,
        mobile: row.Mobile_No,
        linkedIn: row.LinkedIn_Profile_Link
      };

      const personalDetails={
        gender:row.Gender,
        age:row.Age,
        marriage_status:row.Marriage_Status,
        preferred_location:row.Preffered_location,
        current_location:row.Current_location,
        femily_member:row.Member_In_Family,
        father_name:row.Name_of_Father,
        son_name:row.Son_Name,
        spouse_profession:row.Spouse_profession

      }

      const workDetails = {
        designation: row.Designation,
        company_name: row.Company_Name,
        industry: row.Industry,
        current_ctc: row.Current_CTC,
        aspiring_position: row.Role,
        work_experience: row.Total_experience,
        current_report: row.Current_reporting_structure,
        last_reporting: row.Last_reposrting_Structure,
        career_highlight: row.Career_Highlight,
        recognation: row.Recognation,
        functions: row.Functions,
      };

      const educationDetails={
        highest_education:row.Education,
        board_represent:row.Board_Represent_Name,
        articles:row.Articles,
        certificate:row.Certificate
      }

      const savedBasicDetails = await new basic_details(basicDetails).save();
      const savedPersonalDetails=await new personal_details(personalDetails).save();
      const savedWorkDetails=await new work_details(workDetails).save();
      const savedEducationDetails=await new education_details(educationDetails).save();
  
      const newCandidate = new candidate({ basic_details: savedBasicDetails._id,personal_details:savedPersonalDetails._id,work_details:savedWorkDetails._id,education_details:savedEducationDetails._id});
      const savedCandidate = await newCandidate.save();
    }
      res.status(200).json({ message: 'File processed and data stored successfully' });
    }catch(error){
      return res.status(500).json({error:"Internal server error"});
    }
  }