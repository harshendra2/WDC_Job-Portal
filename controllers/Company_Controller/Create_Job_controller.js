const mongoose=require("mongoose");
const moment = require('moment');
const CompanyJob=require("../../models/JobSchema");
const company=require('../../models/Onboard_Company_Schema');
const companySubscription=require("../../models/Company_SubscriptionSchema");

exports.GetRemainingJobStatus=async(req,res)=>{
    const {id}=req.params;
    try{

        const objectId = new mongoose.Types.ObjectId(id); 
        data = await companySubscription.aggregate([
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

          if(data){
            return res.status(200).send(data);
          }

    }catch(error){
        return res.status(500).json({error:"Internal server error"});
    }
}

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
      },
    },
  ]);

  const companyIds = temp.map((item) => item._id);

  const data = await company.find({ _id: { $in: companyIds } });

  const dataWithJobCounts = data.map((company) => {
    const jobInfo = temp.find((job) => job._id.equals(company._id));
    return {
      ...company.toObject(),
      jobCount: jobInfo ? jobInfo.jobCount : 0, // Add total jobCount
      activeJobCount: jobInfo ? jobInfo.activeJobCount : 0, // Add active jobCount
      inactiveJobCount: jobInfo ? jobInfo.inactiveJobCount : 0, // Add inactive jobCount
    };
  });

  if (dataWithJobCounts) {
    return res.status(200).send(dataWithJobCounts);
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
    const {job_title,company_name,industry,salary,experience,location,job_type,work_type,skills,education,description} = req.body;

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
            company_id: id
        });

        await jobCreated.save();

        // Decrease the job_posting count by 1
        existsSubscription.job_posting -= 1;
        await existsSubscription.save();

        return res.status(201).json({message: "Job created successfully",jobData: jobCreated});

    } catch (error) {
        console.log(error);
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

