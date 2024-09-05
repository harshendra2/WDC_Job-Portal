const mongoose=require('mongoose');
const moment = require('moment');
const CompanyJob=require("../../models/JobSchema");


exports.getAppliedJob = async (req, res) => {
    const { userId } = req.params; 

    try {
        const id = new mongoose.Types.ObjectId(userId);

        const jobs = await CompanyJob.find({
            "applied_candidates.candidate_id": id
        });

        if (jobs.length === 0) {
            return res.status(404).json({ message: "No jobs found for this user" });
        }

        const jobDetails = jobs.map(job => {
            const timeSincePosted = moment(job.createdDate).fromNow();
            return {
                ...job._doc,
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
        console.log(error);
        return res.status(500).json({error:"Internal server error"});
    }
}

