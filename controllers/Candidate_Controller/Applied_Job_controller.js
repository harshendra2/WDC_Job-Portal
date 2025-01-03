const mongoose=require('mongoose');
const moment = require('moment');
const { sendMailToRejectOffer,sendMailToCompany} = require('../../Service/sendMail');
const CompanyJob=require("../../models/JobSchema");
const company=require("../../models/Onboard_Company_Schema");
const Candidate=require('../../models/Onboard_Candidate_Schema');


exports.getAppliedJob = async (req, res) => { 
  const { userId, page = 1, limit = 10, filter } = req.params;

  try {
      const skip = (page - 1) * parseInt(limit);
      if (!userId) {
          return res.status(400).json({ error: "Please provide user ID" });
      }
      const id = new mongoose.Types.ObjectId(userId);

      let matchFilter = {};
      switch (filter) {
          case "ApplicationSend":
              matchFilter = {
                  $and: [
                      { "Shortlisted": { $size: 0 } },
                      { "applied_candidates.longlist": false },
                      { "applied_candidates.candidate_id": id }
                  ]
              };
              break;
          case "ApplicationShortlist":
              matchFilter = {
                  $and: [
                      { "Shortlisted.shorted_status": false },
                      { "Shortlisted.reject_status": false },
                      { "applied_candidates.Shortlist_status": true },
                      { "applied_candidates.candidate_id": id },
                      { "Shortlisted.candidate_id": id }
                  ]
              };
              break;
          // case "JobOffer":
          //     matchFilter = {
          //         $and: [
          //             { "Shortlisted.candidate_id": id },
          //             { "Shortlisted.shorted_status": true },
          //             { "Shortlisted.short_Candidate": { $exists: true } },
          //             { "Shortlisted.short_Candidate.offer_accepted_status": "Processing" }
          //         ]
          //     };
          //     break;
          case "JobOfferReject":
              matchFilter = {
                  $and: [
                      { "Shortlisted.candidate_id": id },
                      { "Shortlisted.shorted_status": true },
                      { "Shortlisted.reject_status": false },
                      { "Shortlisted.short_Candidate.offer_accepted_status": "Rejected" }
                  ]
              };
              break;
              case "Hired":
              matchFilter = {
                  $and: [
                      { "Shortlisted.candidate_id": id },
                      { "Shortlisted.shorted_status": true },
                      { "Shortlisted.reject_status": false },
                      { "Shortlisted.short_Candidate.offer_accepted_status": "Accepted" }
                  ]
              };
              break;
              case "ApplicationProcessing":
                matchFilter = {
                    $and: [
                        { "Shortlisted.candidate_id": id },
                        { "Shortlisted.shorted_status": true },
                        { "Shortlisted.short_Candidate.offer_accepted_status": "Processing" }
                    ]
                };
                break;
          case "All":
          default:
              matchFilter = {}; // No filter applied
              break;
      }

      const jobs = await CompanyJob.aggregate([
          { $unwind: "$applied_candidates" },
          { $match: { "applied_candidates.candidate_id": id } },
          { $match: matchFilter },
          {
              $lookup: {
                  from: "companies",
                  localField: "company_id",
                  foreignField: "_id",
                  as: "company_details",
              }
          },
          { $unwind: "$company_details" },
          {
              $project: {
                  company_details: {
                      _id: "$company_details._id",
                      name: "$company_details.name",
                      company_name: "$company_details.company_name",
                      profile: "$company_details.profile",
                      verified_batch: "$company_details.verified_batch"
                  },
                  applied_candidates: 1,
                  job_title: 1,
                  company_id: 1,
                  industry: 1,
                  salary: 1,
                  experience: 1,
                  location: 1,
                  job_type: 1,
                  work_type: 1,
                  skills: 1,
                  education: 1,
                  status: 1,
                  admin_verify: 1,
                  createdDate: 1,
                  No_openings: 1,
                  applied_date: "$applied_candidates.applied_date",
                  Shortlisted: {
                      $filter: {
                          input: "$Shortlisted",
                          as: "shortlisted",
                          cond: { $eq: ["$$shortlisted.candidate_id", id] }
                      }
                  }
              }
          },
          {
              $group: {
                  _id: "$_id",
                  company_details: { $first: "$company_details" },
                  applied_candidates: { $push: "$applied_candidates" },
                  job_title: { $first: "$job_title" },
                  company_id: { $first: "$company_id" },
                  industry: { $first: "$industry" },
                  salary: { $first: "$salary" },
                  experience: { $first: "$experience" },
                  location: { $first: "$location" },
                  job_type: { $first: "$job_type" },
                  work_type: { $first: "$work_type" },
                  skills: { $first: "$skills" },
                  education: { $first: "$education" },
                  status: { $first: "$status" },
                  admin_verify: { $first: "$admin_verify" },
                  createdDate: { $first: "$createdDate" },
                  No_openings: { $first: "$No_openings" },
                  Shortlisted: { $first: "$Shortlisted" },
                  applied_date: { $first: "$applied_date" }
              }
          },
          { $sort: { applied_date: -1, _id: 1 } },
          { $skip: skip },
          { $limit: parseInt(limit) }
      ]);

      if (jobs.length === 0) {
          return res.status(200).send([]);
      }

      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const isGoogleDriveLink = (url) => url?.includes("drive.google.com") || url?.includes("docs.google.com");

      const unappliedJobs = jobs.map((job) => {
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

      return res.status(200).send({ data: unappliedJobs, page });
  } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
  }
};



exports.getSeavedjob=async(req,res)=>{
    const {userId,page,limit}=req.params;
    try{
      const skip = (page - 1) * parseInt(limit);
        const id=new mongoose.Types.ObjectId(userId)
        const job=await CompanyJob.aggregate([
            {$match:{Save_id:id}},
            {$skip:skip},
            {$limit:parseInt(limit)},
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
                'company_details.email':0,
                'company_details.mobile':0,
                'company_details.GST_image':0,
                'company_details.PAN_image':0,
                'company_details.contact_No':0,
                'company_details.contact_email':0,
                'company_details.overView':0,
                'company_details.website_url':0,
                'company_details.self_GST_verify':0,
                'company_details.self_PAN_verify':0,
                Save_id:0,
                description:0,
              }}
        ])

        const baseUrl = `${req.protocol}://${req.get("host")}`;
        const isGoogleDriveLink = (url) => {
          return (
            url &&
            (url.includes("drive.google.com") || url.includes("docs.google.com"))
          );
        };
    
        const unappliedJobs =job
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
        return res.status(200).send({data:unappliedJobs,page});

    }catch(error){
        return res.status(500).json({error:"Internal server error"});
    }
}

exports.GetjobDetails = async (req, res) => {
    const { jobId } = req.params;

    try {
        const jobObjectId = new mongoose.Types.ObjectId(jobId);
        const jobDescription = await CompanyJob.aggregate([
            { $match: { _id: jobObjectId } },
            {
                $lookup: {
                    from: 'companies',
                    localField: 'company_id',
                    foreignField: '_id',
                    as: 'CompanyDetails'
                }
            },
            {
                $project: {
                    applied_candidates: 0,
                    Shortlisted: 0,
                    "CompanyDetails._id": 0,
                    "CompanyDetails.password": 0,
                    "CompanyDetails.email": 0,
                    "CompanyDetails.mobile": 0,
                    "CompanyDetails.GST_image": 0,
                    "CompanyDetails.PAN_image": 0,
                    "CompanyDetails.PAN": 0,
                    "CompanyDetails.GST": 0
                }
            }
        ]);

        if (jobDescription.length === 0) {
            return res.status(404).json({ error: "Job not found" });
        }

        const baseUrl = `${req.protocol}://${req.get("host")}`;

        const isGoogleDriveLink = (url) => {
            return (
                url &&
                (url.includes("drive.google.com") || url.includes("docs.google.com"))
            );
        };

        const companyDetails = jobDescription[0]?.CompanyDetails[0] || {};
        const profileUrl = companyDetails.profile
            ? isGoogleDriveLink(companyDetails.profile)
                ? companyDetails.profile
                : `${baseUrl}/${companyDetails.profile.replace(/\\/g, "/")}`
            : null;

        let data = {
            jobDescription: jobDescription[0],
            profileUrl
        };

        return res.status(200).json(data);

    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
};


exports.GetApplicationStatus=async(req,res)=>{
    const {jobId,userId}=req.params;
    try{
        if(!jobId && !userId){
            return res.status(400).json({error:"Please provide all Ids"});
        }
        const jobID=new mongoose.Types.ObjectId(jobId);
        const userID=new mongoose.Types.ObjectId(userId);

        const jobs = await CompanyJob.aggregate([
            {$match:{_id:jobID}},
            { $match: { "applied_candidates.candidate_id":userID}},
            {
                $project: {
                    company_id:1,
                    applied_candidates:{
                        $filter: {
                            input: "$applied_candidates",
                            as: "applied_candidates",
                            cond: { $eq: ["$$applied_candidates.candidate_id",userID] }
                        }
                    },
                    Shortlisted: {
                        $filter: {
                            input: "$Shortlisted",
                            as: "shortlisted",
                            cond: { $eq: ["$$shortlisted.candidate_id",userID] }
                        }
                    }
                }
            }
        ]);

        const baseUrl = `${req.protocol}://${req.get("host")}`;

        const isGoogleDriveLink = (url) => {
            return (
                url &&
                (url.includes("drive.google.com") || url.includes("docs.google.com"))
            );
        };

        const companyDetails = jobs[0]?.Shortlisted[0]?.short_Candidate|| {};
        const offerletterUrl = companyDetails.offer_letter
            ? isGoogleDriveLink(companyDetails.offer_letter)
                ? companyDetails.offer_letter
                : `${baseUrl}/${companyDetails.offer_letter.replace(/\\/g, "/")}`
            : null;

        let data = {
            jobs: jobs[0],
            offerletterUrl
        };
        return res.status(200).send(data);

    }catch(error){
        return res.status(500).json({error:"Internal server error"});
    }
}

exports.AddCompanyFeedBack = async (req, res) => {
    const { jobId, userId } = req.params;
    const { rating, feedback } = req.body;

    try {
        if(!jobId&&!userId){
            return res.status(400).json({error:"Please provide ID"})
        }
        const jobID =new mongoose.Types.ObjectId(jobId);
        const userID =new  mongoose.Types.ObjectId(userId);
        const companyJob = await CompanyJob.findOne({ _id: jobID });
        if (!companyJob) {
            return res.status(404).json({ error: "Job not found" });
        }

        const feedbackData = {
            candidate_id: userID,
            rating,
            Feedback: feedback
        };
        const [updateShortlisted, updateCompany] = await Promise.all([
            CompanyJob.updateOne(
                { _id: jobID, 'Shortlisted.candidate_id': userID },
                { $set: { 'Shortlisted.$.Candidate_feed_back_Status': true } }
            ),
            company.findByIdAndUpdate(
                companyJob.company_id,
                { $addToSet: { Candidate_Feed_Back: feedbackData } },
                { new: true }
            )
        ]);

        if (updateShortlisted.nModified === 0 || !updateCompany) {
            return res.status(400).json({ error: "Feedback not added" });
        }

        return res.status(200).json({ message: "Feedback added successfully" });

    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
};

exports.OfferLetterRejected = async (req, res) => {
    const { jobId, userId } = req.params;
    try {
        if (!jobId || !userId) {
            return res.status(400).json({ error: "Please provide both jobId and userId." });
        }

        const jobID = new mongoose.Types.ObjectId(jobId);
        const userID = new mongoose.Types.ObjectId(userId);
        const result = await CompanyJob.updateOne(
            { _id: jobID, 'Shortlisted.candidate_id': userID },
            { $set: { 'Shortlisted.$.short_Candidate.offer_accepted_status': "Rejected",'Shortlisted.$.short_Candidate.hired_date':new Date()} }
        );
        if (result.nModified === 0) {
            return res.status(400).json({ error: "Offer rejection failed. Candidate not found or already updated." });
        }

        return res.status(200).json({ message: "Offer letter rejected successfully." });

    } catch (error) {
        return res.status(500).json({ error: "Internal server error." });
    }
};

exports.OfferLetterAccepted = async (req, res) => {
    const { userId, jobId } = req.params;
    try {
        if (!userId || !jobId) {
            return res.status(400).json({ error: "Please provide both userId and jobId." });
        }

        const jobID = new mongoose.Types.ObjectId(jobId);
        const userID = new mongoose.Types.ObjectId(userId);
        const result = await CompanyJob.updateOne(
            { _id: jobID, 'Shortlisted.candidate_id': userID },
            {
                $set: { 'Shortlisted.$.short_Candidate.offer_accepted_status': "Accepted",'Shortlisted.$.short_Candidate.hired_date':new Date() },
                $inc: { hired_Candidate: 1, No_openings: -1 }
            }
        );

        if (result.nModified === 0) {
            return res.status(400).json({ error: "Offer acceptance failed. Candidate not found or already updated." });
        }
        await Candidate.updateOne(
            { _id: userId, 'StartRating.jobId':jobId},
            {
              $set: { 'StartRating.$.rating':5},
            }
           )
        return res.status(200).json({ message: "Offer letter accepted successfully." });

    } catch (error) {
        return res.status(500).json({ error: "Internal server error." });
    }
};


exports.GetOfferRejectOTP = async (req, res) => {
    const { userId} = req.params;
  
    try {
      const ObjectId =new mongoose.Types.ObjectId(userId);
      const candidate = await Candidate.findById(ObjectId).populate('basic_details');
  
      if (!candidate) {
        return res.status(404).json({ error: "Candidate not found" });
      }
  
      const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
  
      const OTP = generateOTP();
  
      const email = candidate?.basic_details?.email;
      if (!email) {
        return res.status(400).json({ error: "Candidate email not found" });
      }
  
      const message = await sendMailToRejectOffer(email, OTP);
      candidate.OTP = OTP;
      await candidate.save();
  
      return res.status(200).json({ message: "OTP sent successfully" });
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  };

  exports.VerifyOfferOTP = async (req, res) => {
    const { userId, jobId } = req.params;
    const { OTP, reason } = req.body;
    try {
      // Validate input
      if (!OTP || !reason) {
        return res.status(400).json({ error: "OTP and reason are required." });
      }
      const userObjectId =new mongoose.Types.ObjectId(userId);
      const jobObjectId =new mongoose.Types.ObjectId(jobId);
  
      // Fetch candidate details
      const candidate = await Candidate.findById(userObjectId).populate("basic_details");
      if (!candidate) {
        return res.status(404).json({ error: "Candidate not found." });
      }
  
      if (OTP != candidate.OTP) {
        return res.status(400).json({ error: "Incorrect OTP. Please provide a valid OTP." });
      }
  
      // Update job details
      const updateResult = await CompanyJob.findOneAndUpdate(
        { _id: jobId, "Shortlisted.candidate_id":userId},
        {
          $set: {
            "Shortlisted.$.short_Candidate.offer_accepted_status": "Rejected",
            "Shortlisted.$.short_Candidate.hired_date": new Date(),
          },
          $inc: { hired_Candidate: -1, No_openings: 1 },
        },
        { new: true } 
      );
      if (!updateResult) {
        return res.status(400).json({
          error: "Offer rejection failed. Candidate not found in job or already updated.",
        });
      }
  
      candidate.OTP = null;
      await candidate.save();
  
      // Fetch company details
      const companyData = await company.findById(updateResult.company_id);
      if (!companyData) {
        return res.status(404).json({ error: "Company not found." });
      }
  
      await sendMailToCompany(
        companyData.email,
        reason,
        companyData.company_name,
        candidate.basic_details?.name,
        updateResult.job_title
      );
  
      return res.status(200).json({ message: "Offer letter rejected successfully." });
    } catch (error) {
      return res.status(500).json({ error: "Internal server error." });
    }
  };