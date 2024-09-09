const mongoose=require("mongoose");
const moment = require('moment');
const CompanyJob=require("../../models/JobSchema");
const company=require('../../models/Onboard_Company_Schema');
const companySubscription=require("../../models/Company_SubscriptionSchema");

exports.GetCreatedJobStatus=async(req,res)=>{
    const {company_id}=req.params;
    try{
        const objectId = new mongoose.Types.ObjectId(company_id);
const temp = await CompanyJob.aggregate([{$match:{company_id:objectId}},
    {
      $group: {
        _id: "$company_id",
        jobCount: { $sum: 1 },
        activeJobCount: {
          $sum: { $cond: [{ $eq: ["$status", true] }, 1, 0] },
        }, 
        inactiveJobCount: {
          $sum: { $cond: [{ $eq: ["$status", false] }, 1, 0] },
        },
        application_recieved: {
          $sum: { $size: { $ifNull: ["$applied_candidates", []] } },
        },
        candidate_hired: {
          $sum: { $size: { $ifNull: ["$hired_candidate", []] } },
        },
        candidate_pipeline:{
          $sum:{$size:{$ifNull:["$Interviewed",[]]}}
        }       
      },
    },
  ]);

  const companyIds = temp.map((item) => item._id);

  const data = await company.find({ _id: { $in: companyIds } });

  const dataWithJobCounts = data.map((company) => {
    const jobInfo = temp.find((job) => job._id.equals(company._id));
    return {
      ...company.toObject(),
      jobCount: jobInfo ? jobInfo.jobCount : 0,
      activeJobCount: jobInfo ? jobInfo.activeJobCount : 0, 
      inactiveJobCount: jobInfo ? jobInfo.inactiveJobCount : 0, 
      application_recieved:jobInfo?jobInfo.application_recieved:0,
      candidate_hired:jobInfo?jobInfo.candidate_hired:0,
      candidate_pipeline:jobInfo?jobInfo.candidate_pipeline:0
    };
  });

  const jobs = await CompanyJob.find({company_id: objectId });

  const PostedJobList = jobs.map(job => {
      const timeSincePosted = moment(job.createdDate).fromNow();
      return {
          ...job._doc,
          timeSincePosted
      };
  });

  const SubscriptionStatus = await companySubscription.aggregate([
    { $match: { company_id:objectId} },
    {
      $lookup: {
        from: 'subscriptionplanes',
        localField: 'subscription_id',
        foreignField: '_id',
        as: 'CompanySubscription'
      }
    }
  ]);

  if (dataWithJobCounts) {
    return res.status(200).send({dataWithJobCounts,PostedJobList,SubscriptionStatus});
  } else {
    return res.status(404).json({ error: "No companies found" });
  }


    }catch(error){
        console.log(error);
        return res.status(500).json({error:"Internal server error"});
    }
}

exports.CreateNewJob = async (req, res) => {
    const { id } = req.params;
    const {job_title,company_name,industry,salary,experience,location,job_type,work_type,skills,education,description,Benifits,responsibility,Requirements} = req.body;

    try {
        const objectId = new mongoose.Types.ObjectId(id); 
        const existsSubscription = await companySubscription.findOne({ company_id: objectId, expiresAt: { $gte: new Date() },createdDate:{$lte:new Date()}})

        if (!existsSubscription) {
            return res.status(404).json({ error: "Subscription not found,Please buy new Subscription plane" });
        }

        if (existsSubscription.job_posting <= 0) {
            return res.status(400).json({ error: "This subscription plan does not allow job postings Please upgrade your subscription plane" });
        }

        // Create a new job
        const jobCreated = new CompanyJob({
            job_title,
            company_name,
            industry,
            salary,
            experience,
            location,
            job_type,
            work_type,
            skills,
            education,
            description,
            company_id: id,
            Benifits,
            responsibility,
            Requirements
        });

        await jobCreated.save();

        // Decrease the job_posting count by 1
        existsSubscription.job_posting -= 1;
        await existsSubscription.save();

        return res.status(201).json({message: "Job created successfully",jobData: jobCreated});

    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
};


exports.deleteJobPosted=async(req,res)=>{
  const {jobId}=req.params;
  try{
    const deleteJob = await CompanyJob.findByIdAndDelete(jobId);
    
    if (deleteJob) {
      return res.status(200).json({ message: "Job deleted successfully" });
    } else {
      return res.status(404).json({ error: "Job not found" }); // Use 404 for not found
    }

  }catch(error){
    return res.status(500).json({error:"Internal server error"});
  }
}

exports.RestartJobPosted = async (req, res) => {
  const { jobId } = req.params;
  try {
    const job = await CompanyJob.findById(jobId);

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    const updatedStatus = await CompanyJob.findByIdAndUpdate(
      jobId,
      { status: !job.status }, 
      { new: true } 
    );

    if (updatedStatus) {
      return res.status(200).json({ message: "Job status updated", status: updatedStatus.status });
    }
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};


//View Single Job application 

exports.ViewJobListDetails=async(req,res)=>{
  const {jobId}=req.params;
  try{
    const objectId = new mongoose.Types.ObjectId(jobId);
    const JobDetails=await CompanyJob.aggregate([
      {$match:{_id:objectId}}]);
      if(JobDetails){
        return res.status(200).send(JobDetails);
      }

  }catch(error){
    return res.status(500).json({error:"Internal server error"});
  }
}

exports.ListoutAllAppliedApplicante=async(req,res)=>{
  const {jobId}=req.params;
  try{
    const jobIds=new mongoose.Types.ObjectId(jobId);
    const CandidateDetails=await CompanyJob.aggregate([{$match:{_id:jobIds}},
  {$unwind:'$applied_candidates'},
  {$lookup:{
    foreignField:''
  }}
    ])

  }catch(error){
    return res.status(500).json({error:"Intenal server error"});
  }
}