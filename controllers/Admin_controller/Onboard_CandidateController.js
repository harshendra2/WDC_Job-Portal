const Joi=require("joi");
const axios=require('axios');
const XLSX = require('xlsx');
const bcrypt=require('bcryptjs');
const mongoose = require('mongoose');
const candidate=require("../../models/Onboard_Candidate_Schema");
const basic_details=require("../../models/Basic_details_CandidateSchema");
const personal_details=require("../../models/Personal_details_candidateSchema");
const work_details=require("../../models/work_details_candidate");
const education_details=require("../../models/education_details_candidateSchema");
const { sendMailToCompany } = require('../../Service/sendMail');
const Counter=require('../../models/CounterSchema');

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
    industry: Joi.string().min(3),
    current_ctc: Joi.number(),
    aspiring_position: Joi.string(),
    work_experience:Joi.string().min(1),
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

  async function getNextCustomId() {
    const result = await Counter.findOneAndUpdate(
      {_id:'collection'},
        { $inc: { sequence_value: 1 } },
        { new: true, upsert: true }
    );
  
    return result.sequence_value;
  }
  
  
  exports.createBasicDetaileCandidate = async (req, res) => {
    const { name, email, mobile, linkedIn} = req.body;
    const { error } = OnboardCandidate.validate({
      name, email, mobile, linkedIn
    });
  
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
  
    try {
      const customId = await getNextCustomId('customers');
      const hashedPassword = await bcrypt.hash("Candidate12#", 12);
      const candidateData = {
        name, email, mobile, linkedIn,password:hashedPassword,
        custom_id:customId
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
  
      const newCandidate = new candidate({ basic_details: savedBasicDetails._id,custom_id:customId});
      const savedCandidate = await newCandidate.save();
      await sendMailToCompany(savedBasicDetails?.email, "Candidate12#", `https://didatabank.com/login`);
  
      return res.status(201).json({ message: "Candidate details added successfully", candidate: savedCandidate });
  
    } catch (error) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  };


  exports.createPersonalDetailsCandidate = async (req, res) => {
    const {gender,age,marriag_status,aadhar_number,PAN, family_member, father_name, son_name, spouse_profession,location,country,id} = req.body;
    // const { error } = OnboardCandidatePersonalDetails.validate({
    //   gender,age,marriag_status,aadhar_number,PAN,family_member, father_name, son_name, spouse_profession
    // });
  
    // if (error) {
    //   return res.status(400).json({ error: error.details[0].message });
    // }
    try {
      const CustomID=await candidate.findById(id);
      const CandidateData = {  gender,age,marriag_status,aadhar_number,PAN,family_member, father_name, son_name, spouse_profession,
        custom_id:CustomID?.custom_id,location,country};
      
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
    const {industry,current_ctc,aspiring_position,work_experience,career_highlight,recognation,functions,preferred_location,current_location,skill,id}=req.body;

    // const { error } = OnboardCandidateWorkDetails.validate({
    //   industry,current_ctc,aspiring_position,work_experience,career_highlight,recognation,functions,preferred_location,current_location
    // });
  
    // if (error) {
    //   return res.status(400).json({ error: error.details[0].message });
    // }

  
    try{

      const CustomID=await candidate.findById(id);
      const Candidatedata={industry,current_ctc,aspiring_position,work_experience,career_highlight,recognation,functions,preferred_location,current_location,resume:req.file?req.file.path:'',skill, custom_id:CustomID?.custom_id};
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
      console.log(error);
      return res.status(500).json({error:"Internal Server Error"});
    }
  }


  exports.createEducationDetailsCandidate = async (req, res) => {
    const { highest_education, board_represent, articles, certificates, id } = req.body;
    // const { error } = OnboardCandidateEducationDetails.validate({
    //     highest_education, board_represent, articles
    // });

    // if (error) {
    //     return res.status(400).json({ error: error.details[0].message });
    // }

    try {
      if(!id){
        return res.status(500).json({error:"Please provide Candidate ID"});
      }
      let certificatesArray
      if(certificates){
         certificatesArray = certificates.map((certificate, index) => {
            const fileFieldName = `certificates[${index}][image]`;
            const file = req?.files[fileFieldName] ? req?.files[fileFieldName][0] :'';
            return {
                Certificate: certificate.certificateName,
                image: file ? file?.path : null,
            };
        });
      }
      const ID=new mongoose.Types.ObjectId(id)
        const CustomID=await candidate.findOne({_id:ID});
        const Candidatedata = {
            highest_education,
            board_represent,
            articles,
            certificates: certificatesArray,
            custom_id:CustomID?.custom_id
        };
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

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

  exports.getAllCandidate = async (req, res) => {
    try {
      const RemainngEmail=await candidate.find({ImportStatus:false}).countDocuments();
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
      return res.status(200).send({data,RemainngEmail});
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
    console.log(req.file.path)
    const {industry,current_ctc,aspiring_position,work_experience,career_highlight,recognation,functions,preferred_location,current_location,skill}=req.body;
    const { error } = OnboardCandidateWorkDetails.validate({
      industry,current_ctc,aspiring_position,work_experience,career_highlight,recognation,functions,preferred_location,current_location
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
        industry,current_ctc,aspiring_position,work_experience,career_highlight,recognation,functions,preferred_location,current_location,resume:req.file.path,skill
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
          Location:'',
          Country:'',
          Resume_Link: '',
          Industry: '',
          Current_CTC: '',
          Role: '',
          Total_experience: '',
          Functions_S: '',
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


  exports.uploadExcelFile = async (req, res) => {
    try {
      const workbook = XLSX.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
  
      if (sheetData.length < 1) {
        return res.status(400).json({ error: "Empty Excel file" });
      }

      for (const row of sheetData) {
        if(!row.Name&& !row.Email&& !row.Mobile_No && !row.linkedIn_Profile_Link&&!row.Gender&&!row.Age&&!row.Marriage_Status&&!row.Aadhar_Number&&!row.PAN_Number&&!row.Member_In_Family&&!row.Name_of_Father&&!row.Son_Name&&!row.Spouse_profession&&!row.Industry&&!row.Current_CTC&&!row.Role&&!row.Total_experience&&!row.Last_reposrting_Structure&&!row.Career_Highlight&&!row.Recognation&&!row.Functions_S&&!row.Preffered_location&&!row.Current_location&&!row.Resume_Link&&!row.Highest_Education&&!row.Board_Represent_Name&&!row.Articles){
          return res.status(400).json({ error: "Empty Excel file" });
        }
        // Validation for basic details
        if (!row.Name || typeof row.Name !== 'string') {
          return res.status(400).json({ error: "Name is required and must be a string." });
        }
        if (!row.Email || !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(row.Email)) {
          return res.status(400).json({ error: `${row.Name} valid email is required.` });
        }
        if (!row.Mobile_No || !/^\d{10}$/.test(row.Mobile_No)) {
          return res.status(400).json({ error: "A valid 10-digit mobile number is required." });
        }
        if (row.linkedIn_Profile_Link && typeof row.linkedIn_Profile_Link !== 'string') {
          return res.status(400).json({ error: "LinkedIn profile link must be a string." });
        }
  
        // Validation for personal details
        if (!row.Gender || typeof row.Gender !== 'string') {
          return res.status(400).json({ error: "Gender is required and must be a string." });
        }
        if (!row.Age || isNaN(row.Age)) {
          return res.status(400).json({ error: "Age is required and must be a number." });
        }
        if (row.Marriage_Status && typeof row.Marriage_Status !== 'string') {
          return res.status(400).json({ error: "Marriage status must be a string." });
        }
        if (row.Aadhar_Number && !/^\d{12}$/.test(row.Aadhar_Number)) {
          return res.status(400).json({ error: "Aadhar number must be a valid 12-digit number." });
        }
        if (row.PAN_Number && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(row.PAN_Number)) {
          return res.status(400).json({ error: "PAN number must be valid." });
        }
        if (row.Member_In_Family && isNaN(row.Member_In_Family)) {
          return res.status(400).json({ error: "Family members must be a number." });
        }
        if (row.Name_of_Father && typeof row.Name_of_Father !== 'string') {
          return res.status(400).json({ error: "Father's name must be a string." });
        }
        if (row.Son_Name && typeof row.Son_Name !== 'string') {
          return res.status(400).json({ error: "Son's name must be a string." });
        }
        if (row.Spouse_profession && typeof row.Spouse_profession !== 'string') {
          return res.status(400).json({ error: "Spouse profession must be a string." });
        }
        if (row.Location && typeof row.Location !== 'string') {
          return res.status(400).json({ error: "Location must be a string." });
        }
        if (row.Country && typeof row.Country !== 'string') {
          return res.status(400).json({ error: "Country must be a string." });
        }
  
       
        if (row.Industry && typeof row.Industry !== 'string') {
          return res.status(400).json({ error: "Industry must be a string." });
        }
        if (row.Current_CTC && isNaN(row.Current_CTC)) {
          return res.status(400).json({ error: "Current CTC must be a number." });
        }
        if (row.Role && typeof row.Role !== 'string') {
          return res.status(400).json({ error: "Aspiring position must be a string." });
        }
        if (row.Total_experience && isNaN(row.Total_experience)) {
          return res.status(400).json({ error: "Work experience must be a number." });
        }
       
        if (row.Career_Highlight && typeof row.Career_Highlight !== 'string') {
          return res.status(400).json({ error: "Career highlight must be a string." });
        }
        if (row.Recognation && typeof row.Recognation !== 'string') {
          return res.status(400).json({ error: "Recognition must be a string." });
        }
        if (row.Functions_S && typeof row.Functions_S !== 'string') {
          return res.status(400).json({ error: "Functions must be a string." });
        }
        if (row.Preffered_location && typeof row.Preffered_location !== 'string') {
          return res.status(400).json({ error: "Preferred location must be a string." });
        }
        if (row.Current_location && typeof row.Current_location !== 'string') {
          return res.status(400).json({ error: "Current location must be a string." });
        }
        if (row.Resume_Link && typeof row.Resume_Link !== 'string') {
          return res.status(400).json({ error: "Resume link must be a string." });
        }

        const isPubliclyAccessible = async (url) => {
          try {
            const response = await axios.get(url, { maxRedirects: 0 });
            return response.status === 200;
          } catch (error) {
            if (error.response && error.response.status === 200) {
              return true;
            }
            return false;
          }
        };
  
        if (row.Resume_Link) {
          const isImageAccessible = await isPubliclyAccessible(row.Resume_Link);
          if (!isImageAccessible) {
            return res.status(400).json({ error: `${row.Name} Resume image URL ${row.Resume_Link} is not publicly accessible` });
          }
        }
  
        // Validation for education details
        if (!row.Highest_Education || typeof row.Highest_Education !== 'string') {
          return res.status(400).json({ error: "Highest education is required and must be a string." });
        }
        if (row.Board_Represent_Name && typeof row.Board_Represent_Name !== 'string') {
          return res.status(400).json({ error: "Board represent name must be a string." });
        }
        if (row.Articles && typeof row.Articles !== 'string') {
          return res.status(400).json({ error: "Articles must be a string." });
        }
  
        // Check if email already exists
        const existingEmail = await basic_details.findOne({ 'HRs.email': row.Email });
        if (existingEmail) {
          return res.status(400).json({ error: `The email "${row.Email}" already exists in our database.` });
        }
  
        // Check if mobile number already exists
        const existingMobile = await basic_details.findOne({ mobile: row.Mobile_No });
        if (existingMobile) {
          return res.status(400).json({ error: `The mobile number "${row.Mobile_No}" already exists in our database.` });
        }
        
      }
      function toCamelCase_Name(input) {
        return input
          .toLowerCase()
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }
  
      for (const row of sheetData) {
        // Validation for basic details
        if (!row.Name || typeof row.Name !== 'string') {
          return res.status(400).json({ error: "Name is required and must be a string." });
        }
        if (!row.Email || !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(row.Email)) {
          return res.status(400).json({ error: `${row.Name} valid email is required.` });
        }
        if (!row.Mobile_No || !/^\d{10}$/.test(row.Mobile_No)) {
          return res.status(400).json({ error: "A valid 10-digit mobile number is required." });
        }
        if (row.linkedIn_Profile_Link && typeof row.linkedIn_Profile_Link !== 'string') {
          return res.status(400).json({ error: "LinkedIn profile link must be a string." });
        }
  
        // Validation for personal details
        if (!row.Gender || typeof row.Gender !== 'string') {
          return res.status(400).json({ error: "Gender is required and must be a string." });
        }
        if (!row.Age || isNaN(row.Age)) {
          return res.status(400).json({ error: "Age is required and must be a number." });
        }
        if (row.Marriage_Status && typeof row.Marriage_Status !== 'string') {
          return res.status(400).json({ error: "Marriage status must be a string." });
        }
        if (row.Aadhar_Number && !/^\d{12}$/.test(row.Aadhar_Number)) {
          return res.status(400).json({ error: "Aadhar number must be a valid 12-digit number." });
        }
        if (row.PAN_Number && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(row.PAN_Number)) {
          return res.status(400).json({ error: "PAN number must be valid." });
        }
        if (row.Member_In_Family && isNaN(row.Member_In_Family)) {
          return res.status(400).json({ error: "Family members must be a number." });
        }
        if (row.Name_of_Father && typeof row.Name_of_Father !== 'string') {
          return res.status(400).json({ error: "Father's name must be a string." });
        }
        if (row.Son_Name && typeof row.Son_Name !== 'string') {
          return res.status(400).json({ error: "Son's name must be a string." });
        }
        if (row.Spouse_profession && typeof row.Spouse_profession !== 'string') {
          return res.status(400).json({ error: "Spouse profession must be a string." });
        }
        if (row.Location && typeof row.Location !== 'string') {
          return res.status(400).json({ error: "Location must be a string." });
        }
        if (row.Country && typeof row.Country !== 'string') {
          return res.status(400).json({ error: "Country must be a string." });
        }
  
        // Validation for work details
        if (row.Industry && typeof row.Industry !== 'string') {
          return res.status(400).json({ error: "Industry must be a string." });
        }
        if (row.Current_CTC && isNaN(row.Current_CTC)) {
          return res.status(400).json({ error: "Current CTC must be a number." });
        }
        if (row.Role && typeof row.Role !== 'string') {
          return res.status(400).json({ error: "Aspiring position must be a string." });
        }
        if (row.Total_experience && isNaN(row.Total_experience)) {
          return res.status(400).json({ error: "Work experience must be a number." });
        }
        if (row.Current_reporting_structure && typeof row.Current_reporting_structure !== 'string') {
          return res.status(400).json({ error: "Current reporting structure must be a string." });
        }
        if (row.Last_reposrting_Structure && typeof row.Last_reposrting_Structure !== 'string') {
          return res.status(400).json({ error: "Last reporting structure must be a string." });
        }
        if (row.Career_Highlight && typeof row.Career_Highlight !== 'string') {
          return res.status(400).json({ error: "Career highlight must be a string." });
        }
        if (row.Recognation && typeof row.Recognation !== 'string') {
          return res.status(400).json({ error: "Recognition must be a string." });
        }
        if (row.Functions_S && typeof row.Functions_S !== 'string') {
          return res.status(400).json({ error: "Functions must be a string." });
        }
        if (row.Preffered_location && typeof row.Preffered_location !== 'string') {
          return res.status(400).json({ error: "Preferred location must be a string." });
        }
        if (row.Current_location && typeof row.Current_location !== 'string') {
          return res.status(400).json({ error: "Current location must be a string." });
        }
        if (row.Resume_Link && typeof row.Resume_Link !== 'string') {
          return res.status(400).json({ error: "Resume link must be a string." });
        }

        const isPubliclyAccessible = async (url) => {
          try {
            const response = await axios.get(url, { maxRedirects: 0 });
            return response.status === 200;
          } catch (error) {
            if (error.response && error.response.status === 200) {
              return true;
            }
            return false;
          }
        };
  
        if (row.Resume_Link) {
          const isImageAccessible = await isPubliclyAccessible(row.Resume_Link);
          if (!isImageAccessible) {
            return res.status(400).json({ error: `${row.Name} Resume image URL ${row.Resume_Link} is not publicly accessible` });
          }
        }
  
        // Validation for education details
        if (!row.Highest_Education || typeof row.Highest_Education !== 'string') {
          return res.status(400).json({ error: "Highest education is required and must be a string." });
        }
        if (row.Board_Represent_Name && typeof row.Board_Represent_Name !== 'string') {
          return res.status(400).json({ error: "Board represent name must be a string." });
        }
        if (row.Articles && typeof row.Articles !== 'string') {
          return res.status(400).json({ error: "Articles must be a string." });
        }
  
        // Check if email already exists
        const existingEmail = await basic_details.findOne({'HRs.email': row.Email });
        if (existingEmail) {
          return res.status(400).json({ error: `The email "${row.Email}" already exists in our database.` });
        }
  
        // Check if mobile number already exists
        const existingMobile = await basic_details.findOne({ mobile: row.Mobile_No });
        if (existingMobile) {
          return res.status(400).json({ error: `The mobile number "${row.Mobile_No}" already exists in our database.` });
        }
        const customId = await getNextCustomId('customers');
        const hashedPassword = await bcrypt.hash("Candidate12#", 12);
        const basicDetails={ name:toCamelCase_Name(row.Name), email:row.Email, mobile:row.Mobile_No, linkedIn:row.linkedIn_Profile_Link,password:hashedPassword,
          custom_id:customId,HRs: [{ email, password: hashedPassword }]};
        const personalDetails={gender:row.Gender,age:row.Age,marriag_status:toCamelCase_Name(row.Marriage_Status),aadhar_number:row.Aadhar_Number,PAN:row.PAN_Number,family_member:row.Member_In_Family, father_name:toCamelCase_Name(row.Name_of_Father), son_name:toCamelCase_Name(row.Son_Name), spouse_profession:toCamelCase_Name(row.Spouse_profession), custom_id:customId,location:toCamelCase_Name(row.Location),country:toCamelCase_Name(row.Country)}
        const workDetails={industry:toCamelCase_Name(row.Industry),current_ctc:row.Current_CTC,aspiring_position:toCamelCase_Name(row.Role),work_experience:row.Total_experience,career_highlight:toCamelCase_Name(row.Career_Highlight),recognation:toCamelCase_Name(row.Recognation),functions:row.Functions_S,preferred_location:row.Preffered_location,current_location:row.Current_location,resume:row.Resume_Link, custom_id:customId}
        const educationDetails={ highest_education:toCamelCase_Name(row.Highest_Education),board_represent:toCamelCase_Name(row.Board_Represent_Name),articles:toCamelCase_Name(row.Articles), custom_id:customId}
  
        // Save data to the database
        const savedBasicDetails = await new basic_details(basicDetails).save();
        const savedPersonalDetails = await new personal_details(personalDetails).save();
        const savedWorkDetails = await new work_details(workDetails).save();
        const savedEducationDetails = await new education_details(educationDetails).save();
  
        // Create a new candidate record
        const newCandidate = new candidate({
          basic_details: savedBasicDetails._id,
          personal_details: savedPersonalDetails._id,
          work_details: savedWorkDetails._id,
          education_details: savedEducationDetails._id,
          custom_id:customId
        });
        await newCandidate.save();
      }
  
      res.status(200).json({ message: `${sheetData.length} Candidate Imported successfully` });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
  

  exports.SendImportedCandidateMail=async(req,res)=>{
    try{
      const candidates = await candidate.find({ ImportStatus: false }).populate('basic_details');
  
for (let data of candidates) {
  
    try {
     
      await sendMailToCompany(data?.basic_details?.email, "Candidate12#", `https://didatabank.com/login`);
      data.ImportStatus = true;
      await data.save();
    } catch (error) {
      console.log(error);
    }
 
}
   return res.status(200).json({message:"Email send successfully"})
    }catch(error){
      return res.status(500).json({error:"Internal server error"})
    }
  }


  exports.uploadExcelFiles = async (req, res) => {
    try {
      const workbook = XLSX.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
  
      function toCamelCase_Name(input) {
        if(input){
        return input
          .toLowerCase()
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        }else{
          return null        }          
      }
  
      for (const row of sheetData) {
        // Validation for basic details
        if (!row.Name || typeof row.Name !== 'string') {
          return res.status(400).json({ error: "Name is required and must be a string." });
        }
        if (!row.Email || !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(row.Email)) {
          return res.status(400).json({ error: `${row.Name} valid email is required.` });
        }
        // if (!row.Phone || !/^\d{10}$/.test(row.Phone)) {
        //   return res.status(400).json({ error: "A valid 10-digit mobile number is required." });
        // }
       
        // Validation for work details
        if (row.Industry && typeof row.Industry !== 'string') {
          return res.status(400).json({ error: "Industry must be a string." });
        }
  
        // Check if mobile number already exists
       
        const customId = await getNextCustomId('customers');
        const hashedPassword = await bcrypt.hash("Candidate12#", 12);
        const basicDetails={ name:toCamelCase_Name(row.Name), email:row.Email, mobile:row.Phone,password:hashedPassword,
          custom_id:customId};
        //const personalDetails={gender:row.Gender,age:row.Age,marriag_status:toCamelCase_Name(row.Marriage_Status),aadhar_number:row.Aadhar_Number,PAN:row.PAN_Number,family_member:row.Member_In_Family, father_name:toCamelCase_Name(row.Name_of_Father), son_name:toCamelCase_Name(row.Son_Name), spouse_profession:toCamelCase_Name(row.Spouse_profession), custom_id:customId,location:toCamelCase_Name(row.Location),country:toCamelCase_Name(row.Country)}
        //const workDetails={industry:toCamelCase_Name(row.Industry), custom_id:customId}
        //const educationDetails={ highest_education:toCamelCase_Name(row.Highest_Education),board_represent:toCamelCase_Name(row.Board_Represent_Name),articles:toCamelCase_Name(row.Articles), custom_id:customId}
  
        // Save data to the database
        const savedBasicDetails = await new basic_details(basicDetails).save();
       // const savedPersonalDetails = await new personal_details(personalDetails).save();
       // const savedWorkDetails = await new work_details(workDetails).save();
        //const savedEducationDetails = await new education_details(educationDetails).save();
  
        // Create a new candidate record
        const newCandidate = new candidate({
          basic_details: savedBasicDetails._id,
          //personal_details: savedPersonalDetails._id,
         // work_details: savedWorkDetails._id,
          //education_details: savedEducationDetails._id,
          custom_id:customId
        });
        await newCandidate.save();
      }
  
      res.status(200).json({ message: `${sheetData.length} Candidate Imported successfully` });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };