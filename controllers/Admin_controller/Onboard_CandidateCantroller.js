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
    linkedIn: Joi.string().min(10), 
  });

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
    designation: Joi.string().min(3),
    company_name: Joi.string().min(5),
    industry: Joi.string().min(3),
    current_ctc: Joi.number(),
    aspiring_position: Joi.string(),
    work_experience:Joi.string().min(1),
    current_report:Joi.string().min(5),
    last_reporting: Joi.string().min(5),
    career_highlight: Joi.string().min(5),
    recognation: Joi.string().min(5),
    functions:Joi.string().min(5),
    preferred_location: Joi.string().min(3),
    current_location: Joi.string().min(3)
  })

  const OnboardCandidateEducationDetails=Joi.object({
    highest_education:Joi.string().min(5),
    board_represent:Joi.string().min(5),
    articles:Joi.string().min(5)
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
       const existEmail=await basic_details.findOne({email:email});
       if(existEmail){
        return res.status(400).json({error:"This email Id already exists in our data base"});
       }

       const existmobile=await basic_details.findOne({mobile:mobile});
       if(existmobile){
        return res.status(400).json({error:"This mobile number already exists in our data base"});
       }
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
    const {gender,age,marriag_status,aadhar_number,PAN, family_member, father_name, son_name, spouse_profession,id} = req.body;
  
    const { error } = OnboardCandidatePersonalDetails.validate({
      gender,age,marriag_status,aadhar_number,PAN,family_member, father_name, son_name, spouse_profession
    });
  
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
  
    try {
      const CandidateData = {  gender,age,marriag_status,aadhar_number,PAN,family_member, father_name, son_name, spouse_profession};
      
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
    const {designation,company_name,industry,current_ctc,aspiring_position,work_experience,current_report,last_reporting,career_highlight,recognation,functions,preferred_location,current_location,id}=req.body;

    const { error } = OnboardCandidateWorkDetails.validate({
      designation,company_name,industry,current_ctc,aspiring_position,work_experience,current_report,last_reporting,career_highlight,recognation,functions,preferred_location,current_location
    });
  
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
  
    try{

      if (!req.file) {
        return res.status(400).json({ error: "Please upload a file" });
      }
      const Candidatedata={designation,company_name,industry,current_ctc,aspiring_position,work_experience,current_report,last_reporting,career_highlight,recognation,functions,preferred_location,current_location,resume:req.file.filename};
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
    const {highest_education,board_represent,articles,certificates,id}=req.body;

    const { error } = OnboardCandidateEducationDetails.validate({
      highest_education,board_represent,articles
    });
  
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    try{

      const certificatesArray = certificates.map((certificate, index) => {
        return {
          Certificate: certificate,
          image: req.files?.find(file => file.fieldname === `certificates[${index}][image]`)?.filename || null,
        };
      });

      const Candidatedata={highest_education,board_represent,articles,certificates:certificatesArray};
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
      ]).sort({ createdAt: -1 });
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
    const {gender,age,marriag_status,aadhar_number,PAN, family_member, father_name, son_name, spouse_profession}=req.body;
    const { error } = OnboardCandidatePersonalDetails.validate({
      gender,age,marriag_status,aadhar_number,PAN, family_member, father_name, son_name, spouse_profession
    });
  
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
  
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid candidate ID' });
      }
  
      const candidateData = {
        gender,age,marriag_status,aadhar_number,PAN, family_member, father_name, son_name, spouse_profession
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

  exports.getWorkdetails = async (req, res) => {
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
            from: 'candidate_work_details',
            localField: 'work_details',
            foreignField: '_id',
            as: 'work_details'
          }
        }
      ]);
  
      if (data.length > 0) {  // Ensure that there is data returned from the aggregation
        const candidateData = data[0];  // Access the first item in the array
  
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        
        // Helper function to check if a URL is a Google Drive link
        const isGoogleDriveLink = (url) => {
          return url && (url.includes('drive.google.com') || url.includes('docs.google.com'));
        };
  
        const updatedData = {
          ...candidateData,  // Use the first item in the aggregation result
          work_details: candidateData.work_details.map(workDetail => ({
            ...workDetail,
            ResumeImageUrl: workDetail.resume
              ? (isGoogleDriveLink(workDetail.resume) ? workDetail.resume : `${baseUrl}/${workDetail.resume.replace(/\\/g, '/')}`)
              : null,
          }))
        };
  
        return res.status(200).json(updatedData);
      } else {
        return res.status(404).json({ error: "Candidate not found" });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  };
  

  exports.editWorkDetails=async(req,res)=>{
    const {id}=req.params;
    const {designation,company_name,industry,current_ctc,aspiring_position,work_experience,current_report,last_reporting,career_highlight,recognation,functions,preferred_location,current_location}=req.body;
    const { error } = OnboardCandidateWorkDetails.validate({
      designation,company_name,industry,current_ctc,aspiring_position,work_experience,current_report,last_reporting,career_highlight,recognation,functions,preferred_location,current_location
    });
  
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    try{

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid candidate ID' });
      }
      if (!req.file) {
        return res.status(400).json({ error: "Please upload a file" });
      }
      const candidateData = {
        designation,company_name,industry,current_ctc,aspiring_position,work_experience,current_report,last_reporting,career_highlight,recognation,functions,preferred_location,current_location,resume:req.file.filename
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


  exports.getEducationData = async (req, res) => {
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
            from: 'candidate_education_details',
            localField: 'education_details',
            foreignField: '_id',
            as: 'education_details'
          }
        }
      ]);
  
      if (data.length > 0) {
        const candidateData = data[0];
        const baseUrl = `${req.protocol}://${req.get('host')}`;
  
        const isGoogleDriveLink = (url) => {
          return url && (url.includes('drive.google.com') || url.includes('docs.google.com'));
        };
  
        const updatedData = {
          ...candidateData,
          education_details: candidateData.education_details.map(educationDetail => ({
            ...educationDetail,
            certificates: educationDetail.certificates.map(certificate => ({
              Certificate: certificate.Certificate,
              image: certificate.image
                ? (isGoogleDriveLink(certificate.image) ? certificate.image : `${baseUrl}/${certificate.image.replace(/\\/g, '/')}`)
                : null,
            }))
          }))
        };
  
        return res.status(200).json(updatedData);
      } else {
        return res.status(404).json({ error: "Candidate not found" });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  };
  

  exports.editEducationDetails=async(req,res)=>{
    const {id}=req.params;
    const {highest_education,board_represent,articles,certificates}=req.body;

    const { error } = OnboardCandidateEducationDetails.validate({
      highest_education,board_represent,articles
    });
  
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    try{
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid candidate ID' });
      }

      const certificatesArray = certificates.map((certificate, index) => {
        return {
          Certificate: certificate,
          image: req.files?.find(file => file.fieldname === `certificates[${index}][image]`)?.filename || null,
        };
      });
  
      const candidateData = {
        highest_education,board_represent,articles,certificates:certificatesArray
      };
  
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

  exports.DownloadExcelTemplate = async (req, res) => {
    try {
      const data = [
        {
          Name: '',
          Email: '',
          Mobile_No: '',
          linkedIn_Profile_Link: '',
          Gender: '',
          Age: '',
          Marriage_Status: '',
          Aadhar_Number: '',
          PAN_Number: '',
          Member_In_Family: '',
          Name_of_Father: '',
          Son_Name: '',
          Spouse_profession: '',
          Resume_Link: '',
          Designation: '',
          Company_name: '',
          Industry: '',
          Current_CTC: '',
          Role: '',
          Total_experience: '',
          Functions_S: '',
          Current_reporting_structure: '',
          Last_reposrting_Structure: '',
          Preffered_location: '',
          Current_location: '',
          Career_Highlight: '',
          Recognation: '',
          Highest_Education: '',
          Board_Represent_Name: '',
          Articles: ''
        }
      ];
  
      const worksheet = XLSX.utils.json_to_sheet(data);
      const columnWidths = Object.keys(data[0]).map((key) => ({
        wch: Math.max(key.length, 20)  // Ensuring a minimum width of 20 characters
      }));
  
      worksheet['!cols'] = columnWidths;
  
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  
      res.setHeader('Content-Disposition', 'attachment; filename="template.xlsx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(excelBuffer);
  
    } catch (error) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  };


  exports.uploadExcelFile=async(req,res)=>{
    try{
      const workbook = XLSX.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
       if(sheetData.length<1){
        return res.status(400).json({error:"Empty Excel file"});
       }
    for (const row of sheetData) {
      const basicDetails = {
        name: row.Name,
        email: row.Email,
        mobile: row.Mobile_No,
        linkedIn: row.linkedIn_Profile_Link
      };

      const personalDetails={
        gender:row.Gender,
        age:row.Age,
        marriag_status:row.Marriage_Status,
        aadhar_number:row.Aadhar_Number,
        PAN:row.PAN_Number,
        family_member:row.Member_In_Family,
        father_name:row.Name_of_Father,
        son_name:row.Son_Name,
        spouse_profession:row.Spouse_profession

      }

      const workDetails = {
        designation: row.Designation,
        company_name: row.Company_name,
        industry: row.Industry,
        current_ctc: row.Current_CTC,
        aspiring_position: row.Role,
        work_experience: row.Total_experience,
        current_report: row.Current_reporting_structure,
        last_reporting: row.Last_reposrting_Structure,
        career_highlight: row.Career_Highlight,
        recognation: row.Recognation,
        functions: row.Functions_S,
        preferred_location:row.Preffered_location,
        current_location:row.Current_location,
        resume:row.Resume_Link
      };

      const educationDetails={
        highest_education:row.Highest_Education,
        board_represent:row.Board_Represent_Name,
        articles:row.Articles
      }

      const existinEmail=await basic_details.findOne({email:row.Email});

      if (existinEmail) {
        return res.status(400).json({ 
          error: `The email "${row.Email}"already exists in our database.` 
        });
      }

      const existinMobile=await basic_details.findOne({mobile:row.Mobile_No,});

      if (existinMobile) {
        return res.status(400).json({ 
          error: `The mobile number "${row.Mobile_No}"already exists in our database.` 
        });
      }

      const savedBasicDetails = await new basic_details(basicDetails).save();
      const savedPersonalDetails=await new personal_details(personalDetails).save();
      const savedWorkDetails=await new work_details(workDetails).save();
      const savedEducationDetails=await new education_details(educationDetails).save();
  
      const newCandidate = new candidate({ basic_details: savedBasicDetails._id,personal_details:savedPersonalDetails._id,work_details:savedWorkDetails._id,education_details:savedEducationDetails._id});
      const savedCandidate = await newCandidate.save();
    }
      res.status(200).json({ message: `${sheetData.length} Company Imported successfully` });
    }catch(error){
      console.log(error);
      return res.status(500).json({error:"Internal server error"});
    }
  }