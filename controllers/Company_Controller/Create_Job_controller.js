const mongoose=require("mongoose");
const moment = require('moment');
const CompanyJob=require("../../models/JobSchema");
const companySubscription=require("../../models/Company_SubscriptionSchema");


exports.CreateNewJob = async (req, res) => {
    const { id } = req.params;
    const {job_title,company_name,industry,salary,experience,location,job_type,work_type,skills,education,description} = req.body;

    try {
        const objectId = new mongoose.Types.ObjectId(id); 
        const existsSubscription = await companySubscription.findOne({ company_id: objectId });

        if (!existsSubscription) {
            return res.status(404).json({ error: "Subscription not found" });
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

exports.GetPostedJob=async(req,res)=>{
    const {id}=req.params;
    try {
        const objectId = new mongoose.Types.ObjectId(id); 
        const jobs = await CompanyJob.find({company_id: objectId });

        const jobDetails = jobs.map(job => {
            const timeSincePosted = moment(job.createdDate).fromNow();
            return {
                ...job._doc,
                timeSincePosted
            };
        });

        const totaljobcreated=jobDetails.length;

        return res.status(200).json({
            totaljobcreated,
            jobDetails
        });

    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

