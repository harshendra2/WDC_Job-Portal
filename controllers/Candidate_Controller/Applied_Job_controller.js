const mongoose=require('mongoose');
const moment = require('moment');
const CompanyJob=require("../../models/JobSchema");
const company=require("../../models/Onboard_Company_Schema");


exports.getAppliedJob = async (req, res) => {
    const { userId } = req.params;

    try {
        if (!userId) {
            return res.status(400).json({ error: "Please provide user Id" });
        }
      const id = new mongoose.Types.ObjectId(userId);

        const jobs = await CompanyJob.aggregate([
            { $match: { "applied_candidates.candidate_id": id }},
            {
                $project: {
                    applied_candidates: 1,
                    job_title: 1,
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
                    Shortlisted: {
                        $filter: {
                            input: "$Shortlisted",
                            as: "shortlisted",
                            cond: { $eq: ["$$shortlisted.candidate_id", id] }
                        }
                    }
                }
            }
        ]);

        if (jobs.length === 0) {
            return res.status(404).json({ message: "No jobs found for this user" });
        }
        const jobDetails = jobs.map(job => {
            const timeSincePosted = moment(job.createdDate).fromNow();
            return {
                ...job,
                timeSincePosted
            };
        });

        return res.status(200).json(jobDetails);
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
};




exports.getSeavedjob=async(req,res)=>{
    const {userId}=req.params;
    try{
        const id=new mongoose.Types.ObjectId(userId)
        const job = await CompanyJob.find({Save_id:id});

        if (job.length === 0) {
            return res.status(404).json({ message: "No jobs found for this user" });
        }
        const jobDetails = job.map(job => {
            const timeSincePosted = moment(job.createdDate).fromNow();
            return {
                ...job._doc,
                timeSincePosted
            };
        });

        return res.status(200).json(jobDetails);

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
                { $set: { 'Shortlisted.$.feed_back_status': true } }
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
        return res.status(200).json({ message: "Offer letter accepted successfully." });

    } catch (error) {
        return res.status(500).json({ error: "Internal server error." });
    }
};
