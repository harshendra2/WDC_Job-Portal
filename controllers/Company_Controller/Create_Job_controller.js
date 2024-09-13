const mongoose=require("mongoose");
const moment = require('moment');
const Joi=require('joi');
const CompanyJob=require("../../models/JobSchema");
const company=require('../../models/Onboard_Company_Schema');
const companySubscription=require("../../models/Company_SubscriptionSchema");

const EditJobs=Joi.object({
  job_title: Joi.string().required(),
  No_openings: Joi.number().required(),
  industry: Joi.string().required(),
  salary: Joi.string().required(),
  experience: Joi.required(),
  location: Joi.string().required(),
  job_type: Joi.string().required(),
  work_type: Joi.string().required(),
  education:Joi.string().required(),
  description: Joi.string().min(100).required()
})

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

exports.GetSuggestionJobDescription=async(req,res)=>{
  try{
    const jobdescription=await CompanyJob.aggregate([{$project:{description:1,_id:0}}]);
    if(jobdescription){
      return res.status(200).send(jobdescription);
    }

  }catch(error){
    return res.status(500).json({error:"Internal server error"});
  }
}

exports.CreateNewJob = async (req, res) => {
    const { id } = req.params;
    const {job_title,No_openings,industry,salary,experience,location,job_type,work_type,skills,education,description} = req.body;

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
            No_openings,
            industry,
            salary,
            experience,
            location,
            job_type,
            work_type,
            skills,
            education,
            description,
            company_id: id
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

    let updatedStatus;

    if (job.status === true) {
      updatedStatus = await CompanyJob.findByIdAndUpdate(
        jobId,
        { status: false },
        { new: true }
      );
    } else {
      updatedStatus = await CompanyJob.findByIdAndUpdate(
        jobId,
        { status: true, createdDate: new Date() },
        { new: true }
      );
    }
    if (updatedStatus) {
      return res.status(200).json({
        message: "Job status updated",
        status: updatedStatus.status,
      });
    }

  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.EditPostedJob=async(req,res)=>{
  const {jobId}=req.params;
  const {job_title,No_openings,industry,salary,experience,location,job_type,work_type,skills,education,description} = req.body;

  const { error } = EditJobs.validate({job_title,No_openings,industry,salary,experience,location,job_type,work_type,education,description});
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  try{
    const jobData = { job_title, No_openings, industry, salary, experience, location, job_type, work_type, skills, education, description };

    const existedJob = await CompanyJob.findByIdAndUpdate(jobId, jobData, { new: true });
    
    if (existedJob) {
      return res.status(200).json({ message: "Job updated successfully", job: existedJob });
    } else {
      return res.status(404).json({ error: "Job not found" });
    }
  }catch(error){
    return res.status(500).json({error:"Internal server error"});
  }
}


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

exports.ListOutAllAppliedApplicants = async (req, res) => {
  const { jobId } = req.params;
  try {
    const jobObjectId = new mongoose.Types.ObjectId(jobId);

    const candidateDetails = await CompanyJob.aggregate([
      { $match: { _id: jobObjectId} }, 
      { $unwind: '$applied_candidates' },
      {$match:{'applied_candidates.Shortlist_status':false}},
      {
        $lookup: {
          from: 'candidates',
          localField: 'applied_candidates.candidate_id',
          foreignField: '_id',
          as: 'CandidateDetails'
        }
      },
      { $unwind: '$CandidateDetails' },
      {
        $lookup: {
          from: 'candidate_basic_details',
          localField: 'CandidateDetails.basic_details',
          foreignField: '_id',
          as: 'BasicDetails'
        }
      },
      { $unwind: '$BasicDetails' },
      {
        $lookup: {
          from: 'candidate_work_details',
          localField: 'CandidateDetails.work_details',
          foreignField: '_id',
          as: 'WorkDetails'
        }
      },
      { $unwind: '$WorkDetails' },
      {
        $project: {
          _id: 1,
          'applied_candidates.applied_date':1,
          'CandidateDetails._id': 1,
          'CandidateDetails.name': 1,
          'CandidateDetails.email': 1,
          'BasicDetails': 1,
          'WorkDetails':1
        }
      }
    ]);

    if (candidateDetails && candidateDetails.length > 0) {
      return res.status(200).json(candidateDetails);
    } else {
      return res.status(404).json({ message: 'No candidates found for this job.' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};


exports.ShortlistCandidate = async (req, res) => {
  const { jobId, userId } = req.params;
  try {
    const jobObjectId = new mongoose.Types.ObjectId(jobId);
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const updateCandidate = await CompanyJob.updateOne(
      { _id: jobObjectId, 'applied_candidates.candidate_id': userObjectId },
      { $set: { 'applied_candidates.$.Shortlist_status': true } }
    );

    if (updateCandidate.nModified === 0) {
      return res.status(404).json({ error: 'Candidate not found or already shortlisted' });
    }

    await CompanyJob.updateOne(
      { _id: jobObjectId },
      {
        $addToSet: {
          Shortlisted: {
            candidate_id: userObjectId,   
            sortlisted_date: new Date() 
          }
        }
      }
    );

    return res.status(200).json({ message: 'Candidate shortlisted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};


exports.ListOutAllShortlistedApplicent = async (req, res) => {
  const { jobId } = req.params;
  try {
    const jobObjectId = new mongoose.Types.ObjectId(jobId);

    const candidateDetails = await CompanyJob.aggregate([
      { $match: { _id: jobObjectId } }, 
      { $unwind: '$Shortlisted' },
      { $match: { 'Shortlisted.shorted_status': false } },
      {
        $lookup: {
          from: 'candidates',
          localField: 'Shortlisted.candidate_id',
          foreignField: '_id',
          as: 'CandidateDetails'
        }
      },
      { $unwind: '$CandidateDetails' },
      {
        $lookup: {
          from: 'candidate_basic_details',
          localField: 'CandidateDetails.basic_details',
          foreignField: '_id',
          as: 'BasicDetails'
        }
      },
      { $unwind: '$BasicDetails' },
      {
        $lookup: {
          from: 'candidate_work_details',
          localField: 'CandidateDetails.work_details',
          foreignField: '_id',
          as: 'WorkDetails'
        }
      },
      { $unwind: '$WorkDetails' },
      {
        $project: {
          _id: 1,
          'Interviewed.interview_Status':1,
          'Shortlisted.sortlisted_date': 1,
          'CandidateDetails._id': 1,
          'CandidateDetails.name': 1,
          'CandidateDetails.email': 1,
          'BasicDetails': 1,
          'WorkDetails': 1
        }
      }
    ]);

    if (candidateDetails && candidateDetails.length > 0) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;

      const updatedData = candidateDetails.map((company) => {
        return {
          ...company,
          resumeUrl: company.WorkDetails?.resume
            ? `${baseUrl}/${company.WorkDetails.resume.replace(/\\/g, '/')}`
            : null,
        };
      });

      return res.status(200).json(updatedData);
    } else {
      return res.status(404).json({ message: "No shortlisted applicants found" });
    }

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};


exports.AddUserFeedBack=async(req,res)=>{
  const {jobId,userId}=req.params;
  const {feedBack,rating}=req.body;
  try{
    const jobObjectId = new mongoose.Types.ObjectId(jobId);
    const userObjectId = new mongoose.Types.ObjectId(userId);
    // const updateCandidate = await CompanyJob.updateOne(
    //   { _id: jobObjectId, 'Shortlisted.candidate_id': userObjectId }
    //   // { $set: { 'applied_candidates.$.Shortlist_status': true } }
    // );

    // if (updateCandidate.nModified === 0) {
    //   return res.status(404).json({ error: 'Candidate not found or already shortlisted' });
    // }

    await CompanyJob.updateOne(
      { _id: jobObjectId },
      {
        $addToSet: {
          Interviewed: {
            candidate_id: userObjectId,   
            sortlisted_date: new Date() ,
            rating,
            feedBack,
            interview_Status:true
          }
        }
      }
    );

    return res.status(200).json({ message: 'FeedBack added successfully' });

  }catch(error){
    return res.status(500).json({error:"Internal server error"});
  }
}

exports.GetUserDetailsForOffer = async (req, res) => {
  const { userId, jobId } = req.params;
  try {
    const userIds = new mongoose.Types.ObjectId(userId);
    const jobIds = new mongoose.Types.ObjectId(jobId);

    const data = await CompanyJob.aggregate([
      { $match: { _id: jobIds } }, 
      { $unwind: '$Interviewed' },
      { $match: { 'Interviewed.candidate_id': userIds } },
      {
        $lookup: {
          from: 'candidates',
          localField: 'Interviewed.candidate_id', // Corrected to match 'Interviewed.candidate_id'
          foreignField: '_id',
          as: 'CandidateDetails'
        }
      },
      { $unwind: '$CandidateDetails' },
      {
        $lookup: {
          from: 'candidate_work_details',
          localField: 'CandidateDetails.work_details',
          foreignField: '_id',
          as: 'workdetails'
        }
      },
      { $unwind: { path: '$workdetails', preserveNullAndEmptyArrays: true } }, // Unwind workdetails, but allow empty results
      {
        $project: {
          applied_candidates: 0,
          Shortlisted: 0,
          Interviewed: 0, // You can modify if you want to keep Interviewed or not
          'CandidateDetails.password': 0, // Hiding sensitive info
          'CandidateDetails.__v': 0,     // Hiding MongoDB version key if unnecessary
        }
      }
    ]);

    if (data && data.length > 0) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;

      const updatedData = data.map((company) => {
        return {
          ...company,
          resumeUrl: company.workdetails?.resume
            ? `${baseUrl}/${company.workdetails.resume.replace(/\\/g, '/')}`
            : null,
        };
      });

      return res.status(200).json(updatedData);
    } else {
      return res.status(404).json({ message: "No shortlisted applicants found" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};



exports.OfferJobToCandidate=async(req,res)=>{
  const {userId,jobId}=req.params;
  if(!req.file){
    return res.status(400).json({error:"Please upload offer letter"});
  }
  try{
    const userIds=new mongoose.Types.ObjectId(userId);
    const jobIds=new mongoose.Types.ObjectId(jobId);

    await CompanyJob.updateOne(
      { _id: jobIds },
      {
        $addToSet: {
          Job_offer: {
            candidate_id: userIds,   
            offer_date: new Date() ,
            offer_letter:req.file.path
          }
        }
      }
    );
    return res.status(200).json({error:"Offer letter uploaded successfully"});

  }catch(error){
    return res.status(500).json({error:"Internal server error"});
  }
}

exports.GetUserDetailswithofferStatus = async (req, res) => {
  const { userId, jobId } = req.params;
  try {
    const userIds = new mongoose.Types.ObjectId(userId);
    const jobIds = new mongoose.Types.ObjectId(jobId);

    const data = await CompanyJob.aggregate([
      { $match: { _id: jobIds } }, 
      { $unwind: '$Job_offer' },
      { $match: { 'Job_offer.candidate_id': userIds } },
      {
        $lookup: {
          from: 'candidates',
          localField: 'Job_offer.candidate_id',
          foreignField: '_id',
          as: 'CandidateDetails'
        }
      },
      { $unwind: '$CandidateDetails' },
      {
        $lookup: {
          from: 'candidate_work_details',
          localField: 'CandidateDetails.work_details',
          foreignField: '_id',
          as: 'workdetails'
        }
      },
      { $unwind: { path: '$workdetails', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          'Job_offer': 1, // Explicitly include Job_offer
          'CandidateDetails.name': 1, // Example of included fields
          'CandidateDetails.email': 1,
          'workdetails': 1, // Include workdetails
        }
      }
    ]);

    if (data && data.length > 0) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;

      const updatedData = data.map((company) => {
        return {
          ...company,
          resumeUrl: company.workdetails?.resume
            ? `${baseUrl}/${company.workdetails.resume.replace(/\\/g, '/')}`
            : null,
        };
      });

      return res.status(200).json(updatedData);
    } else {
      return res.status(404).json({ message: "No shortlisted applicants found" });
    }

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
