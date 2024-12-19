const mongoose=require("mongoose");
const crypto=require("crypto");
const moment = require('moment');
const Joi=require('joi');
const bcrypt=require('bcryptjs');
const Counter=require('../../models/CounterSchema');
const CompanyJob=require("../../models/JobSchema");
const company=require('../../models/Onboard_Company_Schema');
const companySubscription=require("../../models/Company_SubscriptionSchema");
const companyTransaction=require('../../models/CompanyTransactionSchema');
const Candidate=require('../../models/Onboard_Candidate_Schema');
const BasicDetails=require('../../models/Basic_details_CandidateSchema');
const PersonalDetails=require('../../models/Personal_details_candidateSchema');
const PromotePlane=require('../../models/Promote_Job_Schema');
const {sendMailToCandidate}=require('../../Service/sendMail');


async function getNextCustomId() {
  const result = await Counter.findOneAndUpdate(
    {_id:'collection'},
      { $inc: { sequence_value: 1 } },
      { new: true, upsert: true }
  );

  return result.sequence_value;
}

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
  description: Joi.string().min(100).required(),
  country:Joi.string().required()
})

exports.GetCreatedJobStatus = async (req, res) => {
  const { company_id } = req.params;
  try {
      if (!company_id) {
          return res.status(400).json({ error: 'Please provide Company Id' });
      }
      const objectId = new mongoose.Types.ObjectId(company_id);
      const temp = await CompanyJob.aggregate([
          { $match: { company_id: objectId } },
          {
              $group: {
                  _id: '$company_id',
                  jobCount: { $sum: 1 },
                  activeJobCount: {
                      $sum: { $cond: [{ $eq: ['$status', true] }, 1, 0] }
                  },
                  inactiveJobCount: {
                      $sum: {
                          $cond: [
                              {
                                  $or: [
                                      { $eq: ['$status', false] },
                                      {
                                          $gt: [
                                              '$job_Expire_Date',
                                              new Date()
                                          ]
                                      }
                                  ]
                              },
                              1,
                              0
                          ]
                      }
                  },
                  application_recieved: {
                      $sum: {
                          $size: { $ifNull: ['$applied_candidates', []] }
                      }
                  },
                  candidate_hired: {
                      $sum: {
                          $sum: {
                              $size: {
                                  $filter: {
                                      input: {
                                          $ifNull: ['$Shortlisted', []]
                                      },
                                      as: 'shortlistedCandidate',
                                      cond: {
                                          $or: [
                                              {
                                                  $eq: [
                                                      '$$shortlistedCandidate.short_Candidate.offer_accepted_status',
                                                      'Accepted'
                                                  ]
                                              }
                                          ]
                                      }
                                  }
                              }
                          }
                      }
                  },
                  candidate_pipeline: {
                      $sum: {
                          $size: {
                              $filter: {
                                  input: { $ifNull: ['$Shortlisted', []] },
                                  as: 'shortlistedCandidate',
                                  cond: {
                                      $or: [
                                          {
                                              $eq: [
                                                  '$$shortlistedCandidate.interviewed_status',
                                                  false
                                              ]
                                          },
                                          {
                                              $eq: [
                                                  '$$shortlistedCandidate.shorted_status',
                                                  false
                                              ]
                                          }
                                      ]
                                  }
                              }
                          }
                      }
                  }
              }
          }
      ]);

      const companyIds = temp.map(item => item._id);

      const data = await company.find({ _id: { $in: companyIds } });

      const dataWithJobCounts = data.map(company => {
          const jobInfo = temp.find(job => job._id.equals(company._id));
          return {
              ...company.toObject(),
              jobCount: jobInfo ? jobInfo.jobCount : 0,
              activeJobCount: jobInfo ? jobInfo.activeJobCount : 0,
              inactiveJobCount: jobInfo ? jobInfo.inactiveJobCount : 0,
              application_recieved: jobInfo
                  ? jobInfo.application_recieved
                  : 0,
              candidate_hired: jobInfo ? jobInfo.candidate_hired : 0,
              candidate_pipeline: jobInfo ? jobInfo.candidate_pipeline : 0
          };
      });

      const jobs = await CompanyJob.find({ company_id: objectId });

      const PostedJobList = jobs.map(job => {
          const timeSincePosted = moment(job.createdDate).fromNow();
          return {
              ...job._doc,
              timeSincePosted
          };
      });
      const [SubscriptionStatus] = await Promise.all([
          companySubscription.aggregate([
              {
                  $match: {
                      company_id: objectId,
                      expiresAt: { $gte: new Date() },
                      createdDate: { $lte: new Date() }
                  }
              },
              {
                  $lookup: {
                      from: 'subscriptionplanes',
                      localField: 'subscription_id',
                      foreignField: '_id',
                      as: 'AdminSubscription'
                  }
              }
          ])
      ]);

      if (dataWithJobCounts) {
          return res
              .status(200)
              .send({ dataWithJobCounts, PostedJobList, SubscriptionStatus });
      } else {
          return res.status(404).json({ error: 'No companies found' });
      }
  } catch (error) {
      console.log(error);
      return res.status(500).json({ error: 'Internal server error' });
  }
};

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
    const {job_title,No_openings,industry,salary,experience,location,country,job_type,work_type,skills,education,description,Phone_Screening,HR_Round,Technical_Round,Managerial_Round,Panel_Round,Leadership_Round,Project_Round,GD_Round,Behavioral_Testing,Peer_Round} = req.body;
    const { error } = EditJobs.validate({job_title,No_openings,industry,salary,experience,location,job_type,work_type,education,description,country});
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    try {
      if(Phone_Screening==false&&HR_Round==false&&Technical_Round==false&&Managerial_Round==false&&Panel_Round==false&&Leadership_Round==false&&Project_Round==false&&GD_Round==false&&Behavioral_Testing==false&&Peer_Round==false){
        return res.status(400).json({error: "Please select at least one interview round."})
      }
      if(!id){
        return res.status(400).json({error:"Please provide Id"});
      }
        const objectId = new mongoose.Types.ObjectId(id); 
        const GreenBatch=await company.findById(objectId)
        let Batch=false;
        if(GreenBatch?.verified_batch.length!=0){
          Batch=true;
        }
        //const existsSubscription = await companySubscription.findOne({ company_id: objectId, expiresAt: { $gte: new Date() },createdDate:{$lte:new Date()}})
        const existsSubscription = await companySubscription.findOne({
          company_id: objectId,
          expiresAt: { $gte: new Date() },
          createdDate: { $lte: new Date() },
          job_posting: { $gt: 0 }
      })
      .sort({ createdDate: -1 }) 
      .limit(1); 
      
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
            job_Expire_Date,
            Green_Batch:Batch,
            Phone_Screening,
            HR_Round,
            Technical_Round,
            Managerial_Round,
            Panel_Round,
            Leadership_Round,
            Project_Round,
            GD_Round,
            Behavioral_Testing,
            Peer_Round
        });

        await jobCreated.save(existsSubscription.job_posting);
        let count=Number( existsSubscription.job_posting)
        // Decrease the job_posting count by 1
        existsSubscription.job_posting=count-1;
        await existsSubscription.save();

        return res.status(201).json({message: "Job created successfully",jobData: jobCreated});

    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.GetPromotedJobDetails=async(req,res)=>{
  try{
    const data=await PromotePlane.findOne({});
    if(data){
      return res.status(200).send(data)
    }else{
      return res.status(200).json({message:"Plane not available"});
    }

  }catch(error){
    return res.status(500).json({error:"Internal server error"});
  }
}

exports.PromoteJobPayment=async(req,res)=>{
   const apiUrl ='https://sandbox.cashfree.com/pg/orders';
  const { company_id,jobId} = req.body;
  try{
    if(!company_id){
      return res.status(400).json({error:"Please provide company Id"});
    }
   const promoteJob=await PromotePlane.findOne({});
    const companyData=await company.findOne({_id:company_id})
    const orderId = generateOrderId();
    const requestData = {
      customer_details: {
        customer_id:company_id,
        customer_email: companyData?.email,
        customer_phone:String(companyData.mobile),
      },  
      order_meta: {
        return_url:
                    'http://65.20.91.47/main/create-job'
      },
      order_id: "order_"+orderId,
      order_amount:promoteJob?promoteJob?.price:999,
      order_currency: "INR",
      order_note: 'Promote job payment',
      subscriptionid:company_id
    };
    const requestOptions = {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
         'x-api-version': '2022-01-01',
        'x-client-id': process.env.CASHFREE_CLIENT_ID,
       'x-client-secret': process.env.CASHFREE_CLIENT_SECRET
      },
      body: JSON.stringify(requestData)
    };
    
      const response = await fetch(apiUrl, requestOptions);
      const responseData = await response.json();
      if (response.ok) {
        const orderData = {
          company_id:company_id,
          cf_order_id:responseData.cf_order_id,
          customer_id: responseData.customer_details.customer_id,
          entity : responseData.entity,
          order_amount : responseData.order_amount,
          order_currency : responseData.order_currency,
          order_id : responseData.order_id,
          payment_methods : responseData.order_meta.payment_methods,
          paymentLink:responseData?.payment_link,
          order_status : responseData.order_status,
          order_token : responseData.order_token,
          refundsurl : responseData.refunds.url,
          jobId:jobId
        };
        return res.status(200).json(orderData);
      } else {     
        res.status(500).json({ error:"Internal server error",});
      }
  
  }catch(error){
    return res.status(500).json({error:"Internal server error"});
  }
}

exports.CreatePromotesJob=async(req,res)=>{
  const { orderId,company_id,paymentMethod,jobId} = req.body;
  console.log(orderId,company_id,paymentMethod,jobId)
  //const apiUrl = `https://api.cashfree.com/pg/orders/${orderId}`;
  const apiUrl = `https://sandbox.cashfree.com/pg/orders/${orderId}`;
  const headers = {
    'x-client-id':process.env.CASHFREE_CLIENT_ID,
    'x-client-secret':process.env.CASHFREE_CLIENT_SECRET,
    'x-api-version': '2021-05-21',
  };

  try{
    const response = await fetch(apiUrl, {
      method: 'GET', 
      headers: headers
  });

  const result = await response.json();

  if (result.order_status === 'PAID') {
    const promoteJob=await PromotePlane.findOne({});
      const objectId = new mongoose.Types.ObjectId(jobId); 
     
      const currentJob=await CompanyJob.findOne({_id:objectId})
      if (!currentJob) {
        return res.status(404).json({ error: "Job not found" });
      }

      currentJob.promote_job = true; 
      await currentJob.save();

      const transaction=new companyTransaction({
        company_id:company_id,
        type:'Promote job',
        Plane_name:'Promote job',
        price:promoteJob?promoteJob?.price:999,
        payment_method:paymentMethod?paymentMethod:'Cashfree',
        transaction_Id:orderId,
        purchesed_data:new Date(),
        Expire_date:currentJob?.job_Expire_Date
    })
    await transaction.save();

      return res.status(201).json({message: "Job promoted successfully",orderId:orderId});

    } else {
        return res.status(400).json({ error: "payment failed" });
    }

  }catch(error){
    console.log(error)
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

exports.RestartJobOnceExpire=async(req,res)=>{
  const {jobId,cmpId}=req.params;
  try{
    if(!cmpId){
      return res.status(400).json({error:"Please provide Id"});
    }
      const objectId = new mongoose.Types.ObjectId(id); 
      const GreenBatch=await company.findById(objectId)
      let Batch=false;
      if(GreenBatch?.verified_batch.length!=0){
        Batch=true;
      }

    const job_Expire_Date = new Date();
    job_Expire_Date.setMonth(job_Expire_Date.getMonth() + 3);
    const jobData = {job_Expire_Date,createdDate:new Date(),Green_Batch:Batch};

    const updatedJob = await CompanyJob.findByIdAndUpdate(jobId, jobData,{ new: true });
    
    if (updatedJob) {
      return res
        .status(200)
        .json({ message: "Job successfully restarted and updated.", job: updatedJob });
    } else {
      return res.status(404).json({ error: "Job not found." });
    }
    
     }catch(error){
      return res.status(500).json({error:"Intarnal server error"});
     }
}

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
      {$match:{'applied_candidates.longlist':false}},
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
      return res.status(200).json([]);
    }
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.ShortlistedForInterviewRound = async (req, res) => {
  const { jobId, userId } = req.params;
  try {
    if (!jobId || !userId) {
      return res.status(400).json({ error: "Please provide both jobId and userId" });
    }

    const jobObjectId = new mongoose.Types.ObjectId(jobId);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Fetch the job and check for interview rounds
    const jobData = await CompanyJob.findById(jobId);

    if (!jobData) {
      return res.status(404).json({ error: "Job not found" });
    }

    const interviewRounds = [
      { roundKey: 'Phone_Screening', roundName: 'Phone Screening' },
      { roundKey: 'HR_Round', roundName: 'HR Round' },
      { roundKey: 'Technical_Round', roundName: 'Technical Round' },
      { roundKey: 'Managerial_Round', roundName: 'Managerial Round' },
      { roundKey: 'Panel_Round', roundName: 'Panel Round' },
      { roundKey: 'Leadership_Round', roundName: 'Leadership Round' },
      { roundKey: 'Project_Round', roundName: 'Project Round' },
      { roundKey: 'GD_Round', roundName: 'GD Round' },
      { roundKey: 'Behavioral_Testing', roundName: 'Behavioral Testing' },
      { roundKey: 'Peer_Round', roundName: 'Peer Round' }
    ];

    for (const round of interviewRounds) {
      if (jobData[round.roundKey] === true) {
        let data = {
          roundName: round.roundName,
          roundAction: 'Pending'
        };

        await CompanyJob.updateOne(
          { _id: jobObjectId, 'applied_candidates.candidate_id': userObjectId },
          {
            $set: { 'applied_candidates.$.longlist': true,'applied_candidates.$.Longlist_Date':new Date()},
            $push: { 'applied_candidates.$.interviewRound': data }
          }
        );
      }
    }

       await Candidate.updateOne(
        { _id: userId, 'StartRating.jobId':jobId},
        {
          $set: { 'StartRating.$.rating':2},
        }
       )

    return res.status(200).json({ message: "Candidate longlisted successfully" });

  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};


exports.ListoutLongListCandidate = async (req, res) => {
  const { jobId } = req.params;
  try {
    if (!jobId) {
      return res.status(400).json({ error: "Please provide job ID" });
    }
    const jobObjectId = new mongoose.Types.ObjectId(jobId);

    const candidateDetails = await CompanyJob.aggregate([
      { $match: { _id: jobObjectId } },
      { $unwind: '$applied_candidates' },
      { $match: {'applied_candidates.longlist':true ,'applied_candidates.Shortlist_status':false} },
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
          'applied_candidates': 1,
          'CandidateDetails._id': 1,
          'CandidateDetails.name': 1,
          'CandidateDetails.email': 1,
          'BasicDetails.name': 1,
          'BasicDetails.email':1,
          'BasicDetails.mobile':1,
          'WorkDetails.resume': 1
        }
      },
      {
        $sort: { 'applied_candidates.Longlist_Date': -1 }
      }
    ]);

    const isGoogleDriveLink = (url) => {
      return url && (url.includes('drive.google.com') || url.includes('docs.google.com'));
    };

    const bindUrlOrPath = (url) => {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      return isGoogleDriveLink(url) ? url : `${baseUrl}/${url.replace(/\\/g, '/')}`;
    };

    if (candidateDetails && candidateDetails.length > 0) {
      const filteredCandidates = candidateDetails.filter((company) => {
        const allRoundsSelected = company.applied_candidates.interviewRound.every(
          (round) => round.roundAction === 'Selected'
        );
        return !allRoundsSelected;
      });

      const updatedData = filteredCandidates.map((company) => {
        return {
          ...company,
          resumeUrl: company.WorkDetails?.resume
            ? bindUrlOrPath(company.WorkDetails?.resume)
            : null,
        };
      });

      return res.status(200).json(updatedData);
    } else {
      return res.status(200).json([]);
    }
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};


exports.ChangeInterviewStatus = async (req, res) => {
  const { userId, jobId } = req.params;
  const { interviewRound, status } = req.body;
  console.log( userId, jobId )
  console.log(interviewRound, status )

  if (!userId || !jobId) {
    return res.status(400).json({ error: "Please provide both userId and jobId" });
  }

  try {
    const jobObjectId = new mongoose.Types.ObjectId(jobId);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const updateStatus = await CompanyJob.updateOne(
      { 
        _id: jobObjectId, 
        'applied_candidates.candidate_id': userObjectId 
      },
      {
        $set: { 
          'applied_candidates.$.interviewRound.$[inner].roundAction': status 
        }
      },
      {
        arrayFilters: [
          { 
            'inner.roundName': interviewRound 
          }
        ]
      }
    );

    if (updateStatus.modifiedCount === 0) {
      return res.status(404).json({ message: "No matching round found or no update made" });
    }

    if (status === "Selected") {
      const shouldLonglist = await checkAndLonglistCandidate(jobObjectId, userObjectId);
      if (shouldLonglist) {
        await longlistCandidate(jobObjectId, userObjectId);
      }
    }

    return res.status(200).json({ message: "Status updated successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const checkAndLonglistCandidate = async (jobObjectId, userObjectId) => {
  const LonglistCandidate = await CompanyJob.aggregate([
    { 
      $match: { 
        _id: jobObjectId, 
        'applied_candidates.candidate_id': userObjectId 
      }
    },
    { $unwind: '$applied_candidates' }
  ]);
  const allRoundsSelected = LonglistCandidate.every((company) => {
    const interviewRounds = company.applied_candidates.interviewRound;
    return interviewRounds.every((round) => round.roundAction === 'Selected');
  });
  return allRoundsSelected;
};


const longlistCandidate = async (jobObjectId, userObjectId) => {
  await CompanyJob.updateOne(
    { 
      _id: jobObjectId, 
      'applied_candidates.candidate_id': userObjectId 
    },
    {
      $set: { 'applied_candidates.$.Shortlist_status': true }
    }
  );
  
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

  await Candidate.updateOne(
    { _id: userObjectId, 'StartRating.jobId':jobObjectId},
    {
      $set: { 'StartRating.$.rating':3},
    }
   )

};


exports.ListshortList=async(req,res)=>{
  const {jobId}=req.params;
  try{
    if(!jobId){
      return res.status(400).json({error:"Please provide Job ID"});
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
          'Shortlisted.short_Candidate': 1,
          'Shortlisted.shorted_status':1,
          'Shortlisted.reject_status':1,
          'Shortlisted.feed_back_Status':1,
          'CandidateDetails._id': 1,
          'BasicDetails.name': 1,
          'BasicDetails.email': 1,
          'BasicDetails.mobile': 1,
          'WorkDetails.resume': 1
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
      return res.status(200).json([]);
    }

  }catch(error){
    return res.status(500).json({error:"Iternal server error"});
  }
}



exports.AddUserFeedBack=async(req,res)=>{
  const {jobId,userId}=req.params;
  const {feedback}=req.body;
  try{
    if(!jobId && !userId){
      return res.status(400).json({error:"please provide job id and user Id"});
    }
    const jobObjectId = new mongoose.Types.ObjectId(jobId);
    const userObjectId = new mongoose.Types.ObjectId(userId);
    await CompanyJob.updateOne( { _id: jobObjectId,'Shortlisted.candidate_id':userObjectId},
                {
            $set: {
           'Shortlisted.$.feed_back_Status':true   
            }
            },
           { new: true })
           
    const cmpID=await CompanyJob.findById(jobObjectId);
    await Candidate.updateOne(
      { _id:userObjectId},
      {
        $addToSet: {
          Interviewed: {
            company_id:cmpID?.company_id, 
            feedBack:feedback
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
      { $match: { 'Shortlisted.candidate_id': userIds,'Shortlisted.shorted_status':false} },
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
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};


exports.OfferJobToCandidate= async(req,res)=>{
  const {userId,jobId}=req.params;
  const {date}=req.body
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
          'Shortlisted.$.short_Candidate.offer_letter':req.file.path,
          'Shortlisted.$.short_Candidate.offer_date': new Date(),
          'Shortlisted.$.short_Candidate.offer_letter_validity':date,
          'Shortlisted.$.short_Candidate.offer_accepted_status':"Processing",
          'Shortlisted.$.shorted_status':true  
        }
      },
      { new: true }
    );
    await Candidate.updateOne(
      { _id: userId, 'StartRating.jobId':jobId},
      {
        $set: { 'StartRating.$.rating':4},
      }
     )
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

exports.NewOfferLetterOfferedCandidate = async (req, res) => {
  const { Name, email, PAN, validity, status, offer_date, hired_date, mobile } = req.body;
  const { cmpId, jobId } = req.params;

  try {
    if (!req.file) {
      return res.status(400).json({ error: "Please upload the offer letter." });
    }
    const existingJob = await CompanyJob.findById(jobId);
    if (!existingJob) {
      return res.status(400).json({ error: "This job is not available in our database." });
    }

    const existingUser = await BasicDetails.findOne({ email });

    if (existingUser) {
      const userId = await Candidate.findOne({ basic_details:existingUser._id });

      if (!userId) {
        return res.status(400).json({ error: "Candidate data is incomplete in the system." });
      }

      const appliedCandidateData = {
        candidate_id: userId._id,
        longlist: true,
        Shortlist_status: true,
      };

      const shortlistData = {
        candidate_id: userId._id,
        shorted_status: true,
        Candidate_feed_back_Status: true,
        short_Candidate: {
          offer_accepted_status: status,
          offer_date,
          offer_letter: req.file.path,
          offer_letter_validity: validity,
          hired_date,
        },
      };

      await CompanyJob.findByIdAndUpdate(
        jobId,
        {
          $push: {
            applied_candidates: appliedCandidateData,
            Shortlisted: shortlistData,
          },
        },
        { new: true }
      );

      return res.status(200).json({ message: "Offer letter uploaded successfully." });
    } else {
      const customId = await getNextCustomId('candidates');
      const hashedPassword = await bcrypt.hash("Candidate#123", 12);

      const newBasicDetails = new BasicDetails({
        name: Name,
        email,
        mobile,
        custom_id: customId,
        password: hashedPassword,
      });
      const savedBasicDetails = await newBasicDetails.save();

      const newPersonalDetails = new PersonalDetails({
        PAN,
        custom_id: customId,
      });
      const savedPersonalDetails = await newPersonalDetails.save();

      const newCandidate = new Candidate({
        custom_id: customId,
        basic_details: savedBasicDetails._id,
        personal_details: savedPersonalDetails._id,
      });
      const savedCandidate = await newCandidate.save();

      const appliedCandidateData = {
        candidate_id: savedCandidate._id,
        longlist: true,
        Shortlist_status: true,
      };

      const shortlistData = {
        candidate_id: savedCandidate._id,
        shorted_status: true,
        Candidate_feed_back_Status: true,
        short_Candidate: {
          offer_accepted_status: status,
          offer_date,
          offer_letter: req.file.path,
          offer_letter_validity: validity,
          hired_date,
        },
      };

      // Update the job with new candidate data
      await CompanyJob.findByIdAndUpdate(
        jobId,
        {
          $push: {
            applied_candidates: appliedCandidateData,
            Shortlisted: shortlistData,
          },
        },
        { new: true }
      );
      const companies=await company.findById(cmpId)
      let defaultPassword='Candidate#123';
      await sendMailToCandidate(email, Name,companies.company_name, defaultPassword)

      return res.status(200).json({ message: "New candidate added and offer letter uploaded successfully." });
    }
  } catch (error) {
    return res.status(500).json({ error: "Internal server error." });
  }
};
