const mongoose=require("mongoose");
const crypto=require("crypto");
const { Cashfree } = require('cashfree-pg');
const moment = require('moment');
const Joi=require('joi');
const CompanyJob=require("../../models/JobSchema");
const company=require('../../models/Onboard_Company_Schema');
const companySubscription=require("../../models/Company_SubscriptionSchema");
const companyTransaction=require('../../models/CompanyTransactionSchema');
const Candidate=require('../../models/Onboard_Candidate_Schema')

// Configure Cashfree
Cashfree.XClientId = process.env.CASHFREE_CLIENT_ID;
Cashfree.XClientSecret = process.env.CASHFREE_CLIENT_SECRET;
Cashfree.XEnviornment = Cashfree.Environment.SANDBOX;

function generateOrderId() {
    return crypto.randomBytes(6).toString('hex');
}

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
      if(!company_id){
       return res.status(400).json({error:"Please provide Company Id"});
      }
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
          $sum: { $cond: [{ $or: [ { $eq: ["$status",false] }, { $gt: ["$job_Expire_Date", new Date()] } ] },
          1, 
          0] },
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
  const [SubscriptionStatus] = await Promise.all([
    companySubscription.aggregate([
      { $match: { company_id: objectId, expiresAt: { $gte: new Date() } } },
      {
        $lookup: {
          from: "subscriptionplanes",
          localField: "subscription_id",
          foreignField: "_id",
          as: "AdminSubscription",
        },
      },
    ]),
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
    const {job_title,No_openings,industry,salary,experience,location,country,job_type,work_type,skills,education,description} = req.body;

    try {
      if(!id){
        return res.status(400).json({error:"Please provide Id"});
      }
        const objectId = new mongoose.Types.ObjectId(id); 
        const existsSubscription = await companySubscription.findOne({ company_id: objectId, expiresAt: { $gte: new Date() },createdDate:{$lte:new Date()}})

        if (!existsSubscription) {
            return res.status(404).json({ error: "Subscription not found,Please buy new Subscription plane" });
        }

        if (existsSubscription.job_posting <= 0) {
            return res.status(400).json({ error: "This subscription plan does not allow job postings Please upgrade your subscription plane" });
        }

        // Create a new job
        const job_Expire_Date = new Date();
        job_Expire_Date.setMonth(job_Expire_Date.getMonth() + 3);
        const jobCreated = new CompanyJob({
            job_title,
            No_openings,
            industry,
            salary,
            experience,
            location,
            country,
            job_type,
            work_type,
            skills,
            education,
            description,
            company_id: id,
            job_Expire_Date
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

exports.PromoteJobPayment=async(req,res)=>{
  const { company_id, price, mobile, name, email } = req.body;

  if (!price || !mobile || !name || !email) {
      return res.status(400).json({ error: "All fields are required: price, mobile, name, email" });
  }
  try{
    const orderId = generateOrderId();

    const request = {
        "order_amount": price,
        "order_currency": "INR",
        "order_id": orderId,
        "customer_details": {
            "customer_id": company_id, 
            "customer_phone": mobile,
            "customer_name": name,
            "customer_email": email,
        }
    };
    const response = await Cashfree.PGCreateOrder(request);
    return res.json(response.data);
  }catch(error){
    return res.status(500).json({error:"Internal server error"});
  }
}

exports.CreatePromotesJob=async(req,res)=>{
  const { orderId,companyId,paymentMethod,price,job_title,No_openings,industry,salary,experience,location,country,job_type,work_type,skills,education,description} = req.body;
  try{
    const response = await Cashfree.PGOrderFetchPayment(orderId);

    if (response && response.data && response.data.order_status === 'PAID') {
      const objectId = new mongoose.Types.ObjectId(companyId); 
      const existsSubscription = await companySubscription.findOne({ company_id: objectId, expiresAt: { $gte: new Date() },createdDate:{$lte:new Date()}})

      if (!existsSubscription) {
          return res.status(404).json({ error: "Subscription not found,Please buy new Subscription plane" });
      }

      if (existsSubscription.job_posting <= 0) {
          return res.status(400).json({ error: "This subscription plan does not allow job postings Please upgrade your subscription plane" });
      }

      // Create a new job
      const job_Expire_Date = new Date();
      job_Expire_Date.setMonth(job_Expire_Date.getMonth() + 3);
      const jobCreated = new CompanyJob({
          job_title,
          No_openings,
          industry,
          salary,
          experience,
          location,
          country,
          job_type,
          work_type,
          skills,
          education,
          description,
          company_id:companyId,
          job_Expire_Date,
          promote_job:true
      });

      await jobCreated.save();

      // Decrease the job_posting count by 1
      existsSubscription.job_posting -= 1;
      await existsSubscription.save();

      const transaction=new companyTransaction({
        company_id:companyId,
        type:'Promote job',
        Plane_name:'Promote job',
        price:price,
        payment_method:paymentMethod,
        transaction_Id:orderId,
        purchesed_data:new Date(),
        Expire_date:job_Expire_Date
    })
    await transaction.save();

      return res.status(201).json({message: "Job created successfully",jobData: jobCreated});

    } else {
        return res.status(400).json({ error: "payment failed" });
    }

  }catch(error){
    return res.status(500).json({error:"Internal server error"});
  }
}


exports.deleteJobPosted=async(req,res)=>{
  const {jobId}=req.params;
  try{
    if(!jobId){
      return res.status(400).json({error:"please provide job id"});
    }
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
    if(!jobId){
      return res.status(400).json({error:"please provide job id"});
    }
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
        { status: true},
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

// View Single Job application
exports.ViewJobListDetails = async (req, res) => {
  const { jobId } = req.params;
  try {
    if(!jobId){
      return res.status(400).json({error:"please provide job id"});
    }
      const objectId = new mongoose.Types.ObjectId(jobId);
      const JobDetails = await CompanyJob.aggregate([
          { $match: { _id: objectId } },
          {
              $lookup: {
                  from: 'companies',
                  localField: 'company_id',
                  foreignField: '_id',
                  as: 'CompanyDetails'
              }
          },
          {
              $unwind: {
                  path: '$CompanyDetails',
                  preserveNullAndEmptyArrays: true
              }
          }
      ]);

      if (JobDetails.length === 0) {
          return res.status(404).json({ error: "Job not found" });
      }

      const job = JobDetails[0]; 

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const isGoogleDriveLink = (url) => {
          return url && (url.includes('drive.google.com') || url.includes('docs.google.com'));
      };

      const updatedData = {
          ...job,
          profileUrl: job.CompanyDetails?.profile
              ? (isGoogleDriveLink(job.CompanyDetails?.profile)
                  ? job.CompanyDetails?.profile
                  : `${baseUrl}/${job.CompanyDetails?.profile.replace(/\\/g, '/')}`)
              : null
      };

      return res.status(200).json(updatedData);
  } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
  }
};


exports.ListOutAllAppliedApplicants = async (req, res) => {
  const { jobId } = req.params;
  try {
    if(!jobId){
      return res.status(400).json({error:"Please provide Job Id"})
    }
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
      },
      {
        $sort: { 'applied_candidates.applied_date': -1} 
      }

    ]);
    const isGoogleDriveLink = (url) => {
      return url && (url.includes('drive.google.com') || url.includes('docs.google.com'));
    };

    const bindUrlOrPath = (url) => {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      return isGoogleDriveLink(url)
        ? url
        : `${baseUrl}/${url.replace(/\\/g, '/')}`;
    };
    if (candidateDetails && candidateDetails.length > 0) {

      const updatedData = candidateDetails.map((company) => {
        return {
          ...company,
          resumeUrl: company.WorkDetails?.resume
            ?bindUrlOrPath(company.WorkDetails?.resume)
            : null,
        };
      });

      return res.status(200).json(updatedData);
    } else {
      return res.status(404).json({ message: "No shortlisted applicants found" });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};




exports.ShortlistCandidate = async (req, res) => {
  const { jobId, userId } = req.params;
  try {
    if(!jobId &&!userId){
      return res.status(400).json({error:"Please provide all ID"});
    }
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
    if(!jobId){
      return res.status(400).json({error:"please provide job id"});
    }
    const jobObjectId = new mongoose.Types.ObjectId(jobId);
    const candidateDetails = await CompanyJob.aggregate([
      { $match: { _id: jobObjectId } }, 
      { $unwind: '$Shortlisted' },
      {$match: {'Shortlisted.reject_status':false}},
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
          'Shortlisted.sortlisted_date': 1,
          'Shortlisted.interviewed_status': 1,
          'Shortlisted.short_Candidate': 1,
          'CandidateDetails._id': 1,
          'CandidateDetails.name': 1,
          'CandidateDetails.email': 1,
          'BasicDetails': 1,
          'WorkDetails': 1
        }
      },
      {
        $sort: { 'Shortlisted.sortlisted_date': -1} 
      }
    ]);
    const isGoogleDriveLink = (url) => {
      return url && (url.includes('drive.google.com') || url.includes('docs.google.com'));
    };

    const bindUrlOrPath = (url) => {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      return isGoogleDriveLink(url)
        ? url
        : `${baseUrl}/${url.replace(/\\/g, '/')}`;
    };
    if (candidateDetails && candidateDetails.length > 0) {

      const updatedData = candidateDetails.map((company) => {
        return {
          ...company,
          resumeUrl: company.WorkDetails?.resume
            ?bindUrlOrPath(company.WorkDetails?.resume)
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
    if(!jobId && !userId){
      return res.status(400).json({error:"please provide job id and user Id"});
    }
    const jobObjectId = new mongoose.Types.ObjectId(jobId);
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const companyID=await CompanyJob.updateOne( { _id: jobObjectId,'Shortlisted.candidate_id':userObjectId},
                {
            $set: {
           'Shortlisted.$.interviewed_status':true   
            }
            },
           { new: true })

    await Candidate.updateOne(
      { _id:userObjectId},
      {
        $addToSet: {
          Interviewed: {
            company_id:companyID?.company_id, 
            rating,
            feedBack
          }
        }
      }
    );

    return res.status(200).json({ message: 'FeedBack added successfully' });

  }catch(error){
    return res.status(500).json({error:"Internal server error"});
  }
}

exports.RejectApplicent=async(req,res)=>{
  const {jobId,userId}=req.params;
  try{
    if(!jobId && !userId){
      return res.status(400).json({error:"please provide job id and user id"});
    }
    const jobObjectId = new mongoose.Types.ObjectId(jobId);
    const userObjectId = new mongoose.Types.ObjectId(userId);
    await CompanyJob.updateOne(
      { _id: jobObjectId,'Shortlisted.candidate_id':userObjectId},
      {
        $set: {
           'Shortlisted.$.reject_status':true   
        }
      },
      { new: true }
    );
   
    return res.status(200).json({ message: 'Candidate rejected successfully' });


  }catch(error){
    return res.status(500).json({error:"Internal server error"});
  }
}

exports.HireCandidate=async(req,res)=>{
  const {userId,jobId}=req.params;
  try{
    if(!userId && !jobId){
      return res.status(400).json({error:"please provide user id and job id"});
    }
    const jobObjectId = new mongoose.Types.ObjectId(jobId);
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const data=await CompanyJob.updateOne(
      { _id: jobObjectId,'Shortlisted.candidate_id':userObjectId},
      {
        $set: {
           'Shortlisted.$.shorted_status':true   
        }
      },
      { new: true }
    );
   
    return res.status(200).json({ message: 'Candidate hired',data});
  }catch(error){
    return res.status(500).json({error:"Internal server error"});
  }
}

exports.GetUserDetailsForOffer = async (req, res) => {
  const { userId, jobId } = req.params;
  try {
    if(!userId && !jobId){
      return res.status(400).json({error:"please provide user id and job id"});
    }
    const userIds = new mongoose.Types.ObjectId(userId);
    const jobIds = new mongoose.Types.ObjectId(jobId);
    const data = await CompanyJob.aggregate([
      { $match: { _id: jobIds } }, 
      { $unwind: '$Shortlisted' },
      { $match: { 'Shortlisted.candidate_id': userIds,'Shortlisted.shorted_status':true} },
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
          as: 'basicdetails'
        }
      },
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
          applied_candidates: 0,
          Shortlisted: 0,
          Interviewed: 0, 
          'CandidateDetails.password': 0, 
          'CandidateDetails.__v': 0, 
        }
      }
    ]);
    const isGoogleDriveLink = (url) => {
      return url && (url.includes('drive.google.com') || url.includes('docs.google.com'));
    };

    const bindUrlOrPath = (url) => {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      return isGoogleDriveLink(url)
        ? url
        : `${baseUrl}/${url.replace(/\\/g, '/')}`;
    };
    if (data && data.length > 0) {

      const updatedData = data.map((company) => {
        return {
          ...company,
          resumeUrl: company.workdetails?.resume
            ? bindUrlOrPath(company.workdetails?.resume)
            : null,
          profileUrl:company?.CandidateDetails?.profile
          ?bindUrlOrPath(company?.CandidateDetails?.profile)
          :null
        };
      });

      return res.status(200).json(updatedData);
    } else {
      return res.status(404).json({ message: "No shortlisted applicants found" });
    }
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};


exports.OfferJobToCandidate= async(req,res)=>{
  const {userId,jobId}=req.params;
  try{
    if(!userId&& !jobId){
      return res.status(400).json({error:"please provide user id and job id"});
    }
    if(!req.file){
      return res.status(400).json({error:"Please upload offer letter"});
    }
    const userIds=new mongoose.Types.ObjectId(userId);
    const jobIds=new mongoose.Types.ObjectId(jobId);
    const data=await CompanyJob.updateOne(
      { _id: jobIds,'Shortlisted.candidate_id':userId},
      {
        $set: {
          'Shortlisted.$.short_Candidate.offer_letter':req.file,
          'Shortlisted.$.short_Candidate.offer_date': new Date(),
          'Shortlisted.$.short_Candidate.offer_accepted_status':"Processing"
        }
      },
      { new: true }
    );
    console.log(data);
    return res.status(200).json({error:"Offer letter uploaded successfully"});

  }catch(error){
    return res.status(500).json({error:"Internal server error"});
  }
}

exports.GetUserDetailswithofferStatus = async (req, res) => {
  const { userId, jobId } = req.params;
  try {
    if(!userId && !jobId){
      return res.status(400).json({error:"please provide user id and job id"});
    }
    const userIds = new mongoose.Types.ObjectId(userId);
    const jobIds = new mongoose.Types.ObjectId(jobId);
    const data = await CompanyJob.aggregate([
      { $match: { _id: jobIds } }, 
      { $unwind: '$Shortlisted' },
      { $match: { 'Shortlisted.candidate_id': userIds,'Shortlisted.shorted_status':true} },
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
          as: 'basicdetails'
        }
      },
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
          applied_candidates: 0,
          Interviewed: 0, 
          description:0,
          'CandidateDetails.password': 0, 
          'CandidateDetails.__v': 0, 
        }
      }
    ]);
    const isGoogleDriveLink = (url) => {
      return url && (url.includes('drive.google.com') || url.includes('docs.google.com'));
    };

    const bindUrlOrPath = (url) => {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      return isGoogleDriveLink(url)
        ? url
        : `${baseUrl}/${url.replace(/\\/g, '/')}`;
    };
    if (data && data.length > 0) {

      const updatedData = data.map((company) => {
        return {
          ...company,
          resumeUrl: company.workdetails?.resume
            ? bindUrlOrPath(company.workdetails?.resume)
            : null,
          profileUrl:company?.CandidateDetails?.profile
          ?bindUrlOrPath(company?.CandidateDetails?.profile)
          :null,
          offerletterUrl:company?.Shortlisted?.short_Candidate?.offer_letter
          ?bindUrlOrPath(company?.Shortlisted?.short_Candidate?.offer_letter)
          :null,
        };
      });

      return res.status(200).json(updatedData);
    } else {
      return res.status(404).json({ message: "No shortlisted applicants found" });
    }
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};
