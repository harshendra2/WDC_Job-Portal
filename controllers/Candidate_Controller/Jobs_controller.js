const mongoose=require('mongoose');
const moment = require('moment');
const CompanyJob=require("../../models/JobSchema");
const Company=require('../../models/Onboard_Company_Schema');


exports.KeywordJobSearch = async (req, res) => {
  const { userId } = req.params;
  const {
    search,
    experience,
    location,
    industry,
    salary,
    job_type,
    date_posted,
  } = req.body;

  try {
    const [jobTitle = "", company = ""] = search
      ? search.split(",").map((param) => param.trim())
      : ["", ""];

    let conditions = [];
    if (experience) {
      const expCondition = !isNaN(Number(experience))
        ? { "workDetails.work_experience": Number(experience) }
        : {
            "workDetails.work_experience": {
              $regex: experience,
              $options: "i",
            },
          };
      conditions.push(expCondition);
    }
    if (location) {
      conditions.push({
        $or: [
          {
            "workDetails.current_location": { $regex: location, $options: "i" },
          },
          { "workDetails.country": { $regex: location, $options: "i" } },
        ],
      });
    }
    if (industry) {
      conditions.push({
        industry: { $regex: industry, $options: "i" },
      });
    }

    if (salary) {
      const salaryCondition = !isNaN(Number(salary))
        ? { salary: { $gte: Number(salary) } }
        : { salary: { $regex: salary, $options: "i" } };
      conditions.push(salaryCondition);
    }

    if (job_type) {
      conditions.push({
        job_type: { $regex: job_type, $options: "i" },
      });
    }

    if (date_posted) {
      const daysAgo = parseInt(date_posted);

      if (!isNaN(daysAgo)) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() - daysAgo);

        conditions.push({
          createdDate: { $gte: targetDate },
        });
      }
    }

    if (jobTitle || company) {
      conditions.push({
        $or: [
          {
            $and: [
              {
                "company_details.company_name": {
                  $regex: company,
                  $options: "i",
                },
              },
              {
                "company_details.company_name": {
                  $regex: jobTitle,
                  $options: "i",
                },
              },
            ],
          },
          {
            $and: [
              { job_title: { $regex: company, $options: "i" } },
              { job_title: { $regex: jobTitle, $options: "i" } },
            ],
          },
          {
            $and: [
              { job_title: { $regex: jobTitle, $options: "i" } },
              {
                "company_details.company_name": {
                  $regex: company,
                  $options: "i",
                },
              },
            ],
          },
        ],
      });
    }
    const query = conditions.length > 0 ? { $and: conditions } : {};
    const sortedJobs = await CompanyJob.aggregate([
      { $match: { job_Expire_Date: { $gte: new Date() } } },
      {
        $lookup: {
          from: "companies",
          localField: "company_id",
          foreignField: "_id",
          as: "company_details",
        },
      },
      { $unwind: "$company_details" },
      { $match: query },
      {$project:{
        Shortlisted:0,
        'company_details.email':0,
        'company_details.mobile':0,
        'company_details.password':0,
        'company_details.GST':0,
        'company_details.PAN':0,
        'company_details.GST_image':0,
        'company_details.PAN_image':0,
        'company_details.contact_No':0,
        'company_details.contact_email':0,
        'company_details.overView':0,
        'company_details.website_url':0,
        'company_details.Logged_In_count':0,
        'company_details.Candidate_Feed_Back':0
      }}
    ]).sort({ promote_job: -1, createdDate: 1 });

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const isGoogleDriveLink = (url) => {
      return (
        url &&
        (url.includes("drive.google.com") || url.includes("docs.google.com"))
      );
    };

    const unappliedJobs = sortedJobs
      .filter(
        (job) =>
          !job.applied_candidates.some(
            (candidate) => candidate.candidate_id.toString() == userId
          )
      )
      .map((job) => {
        const timeSincePosted = moment(job.createdDate).fromNow();
        const profileUrl = job?.company_details?.profile
          ? isGoogleDriveLink(job?.company_details?.profile)
            ? job?.company_details?.profile
            : `${baseUrl}/${job?.company_details?.profile.replace(/\\/g, "/")}`
          : null;

        return {
          ...job,
          profileUrl,
          timeSincePosted,
        };
      });
    return res.status(200).send(unappliedJobs);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};


exports.getUnappliedJob = async (req, res) => {
    const { id } = req.params; 

    try {
        const sortedJobs = await CompanyJob.aggregate([
          { $match: { job_Expire_Date: { $gte: new Date() } } },
          {
            $lookup: {
              from: "companies",
              localField: "company_id",
              foreignField: "_id",
              as: "company_details",
            },
          },
          { $unwind: "$company_details" },
          {$project:{
            'company_details.Candidate_Feed_Back':0,
            'company_details.password':0,
            'company_details.GST':0,
            'company_details.PAN':0,
            'company_details.Logged_In_count':0,
          }}
        ]).sort({ promote_job: -1, createdDate: 1 });
    
        const baseUrl = `${req.protocol}://${req.get("host")}`;
        const isGoogleDriveLink = (url) => {
          return (
            url &&
            (url.includes("drive.google.com") || url.includes("docs.google.com"))
          );
        };
    
        const unappliedJobs = sortedJobs
          .filter(
            (job) =>
              !job.applied_candidates.some(
                (candidate) => candidate.candidate_id.toString() == id
              )
          )
          .map((job) => {
            const timeSincePosted = moment(job.createdDate).fromNow();
            const profileUrl = job?.company_details?.profile
              ? isGoogleDriveLink(job?.company_details?.profile)
                ? job?.company_details?.profile
                : `${baseUrl}/${job?.company_details?.profile.replace(/\\/g, "/")}`
              : null;
    
            return {
              ...job,
              profileUrl,
              timeSincePosted,
            };
          });
        return res.status(200).send(unappliedJobs);
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
};

exports.getJobDetails=async(req,res)=>{
    const {id}=req.params;
    try{
        const objectId = new mongoose.Types.ObjectId(id); 
        const job=await CompanyJob.findById({_id:objectId});
         
        const timeSincePosted = moment(job.createdDate).fromNow();

        const jobDetails = {
            ...job._doc,
            timeSincePosted
        };
    
        if(jobDetails){
            return res.status(200).send(jobDetails);
        }

    }catch(error){
        console.log(error);
        return res.status(500).json({error:"Internal server error"});
    }
}

exports.GetCompanyDetails=async(req,res)=>{
  const {companyId}=req.params;
  try{
    if(!companyId){
      return res.status(400).json({error:"Plese provide company ID"});
    }
    const Object=new mongoose.Types.ObjectId(companyId);
    const data=await Company.aggregate([{$match:{_id:Object}},
      {$project:{
        company_name:1,
        industry:1,
        overView:1,
        profile:1,
        Candidate_Feed_Back:1
      }}
    ]);
    const starRating = data[0]?.Candidate_Feed_Back.map((temp) => temp.rating);
    const totalRating = starRating.reduce((acc, rating) => acc + rating, 0);
    const averageRating = starRating.length > 0 ? totalRating / starRating.length : 0;
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const isGoogleDriveLink = (url) => {
      return url && (url.includes('drive.google.com') || url.includes('docs.google.com'));
    };
    const updatedData={
      ...data,
      profileUrl: data[0].profile
          ? (isGoogleDriveLink(data[0].profile) ? data[0].profile : `${baseUrl}/${data[0].profile.replace(/\\/g, '/')}`)
          : null,
    }
  return res.status(200).send({updatedData,averageRating});

  }catch(error){
    return res.status(500).json({error:"Internal server error"});
  }
}

exports.GetCompanyBasicDetails=async(req,res)=>{
  const {companyId}=req.params;
  try{
    if(!companyId){
      return res.status(400).json({error:"Please provide company ID"});
    }
    const object=new mongoose.Types.ObjectId(companyId)
    const data=await Company.aggregate([{$match:{_id:object}},
      {$project:{
        email:1,
        mobile:1,
        headQuater_add:1,
        location:1,
        website_url:1,
        company_size:1
      }}
    ])
    if(data){
      return res.status(200).send(data);
    }
  }catch(error){
    return res.status(500).json({error:"Internal server error"});
  }
}

exports.GetAllJobpostedByCompany=async(req,res)=>{
  const {companyId}=req.params;
  try{
    if(!companyId){
      return res.status(400).json({error:"Please provide company Id"});
    }
    const objectId=new mongoose.Types.ObjectId(companyId);
    const jobs = await CompanyJob.find({ company_id: objectId });

    const PostedJobList = jobs.map(job => {
        const timeSincePosted = moment(job.createdDate).fromNow();
        return {
            ...job._doc,
            timeSincePosted
        };
    });
    if(PostedJobList){
      return res.status(200).send(PostedJobList);
    }

  }catch(error){
    return res.status(500).json({error:"Intrnal server error"});
  }
}

exports.GetAllCompanyReveiw=async(req,res)=>{
  const {companyId}=req.params;
  try{
    if(!companyId){
      return res.status(400).json({error:"Please provide Company Id"});
    }
    const objectId=new mongoose.Types.ObjectId(companyId)
    const data = await Company.findById(objectId, { Candidate_Feed_Back: 1, _id: 0 })
    .populate({
      path: 'Candidate_Feed_Back.candidate_id',
      select: 'profile basic_details',
      populate: {
        path: 'basic_details',
        select: 'name'
      }
    });
    return res.status(200).send(data);

  }catch(error){
    return res.status(500).json({error:"Internal server error"});
  }
}


exports.applyToJob = async (req, res) => {
    const { userId, jobId } = req.params;

    try {
        const job = await CompanyJob.findById(jobId);
        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }

        const applyToJob = await CompanyJob.findOneAndUpdate(
            { _id: jobId },
            {
                $addToSet: {
                    applied_candidates: {
                        candidate_id: userId,   
                        applied_date: new Date() 
                    }
                }
            },
            { new: true }
        );

        if (!applyToJob) {
            return res.status(404).json({ message: "Job not found" });
        }

        await CompanyJob.findOneAndUpdate(
            { _id: jobId },
            { $pull: { Save_id: userId } }, 
            { new: true }
        );

        return res.status(200).json({ message: "Job applied successfully", job: applyToJob });
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
};



exports.saveJob=async(req,res)=>{
    const { userId, jobId } = req.params;
    try{

        const SaveToJob = await CompanyJob.findOneAndUpdate(
            { _id: jobId },
            { $addToSet: { Save_id: userId } },
            { new: true } 
        );

        if (!SaveToJob) {
            return res.status(404).json({ message: "Job not found" });
        }

        return res.status(200).json({ message: "Job saved successfully", job: SaveToJob });

    }catch(error){
        return res.status(500).json({error:"Internal server error"});
    }
}
