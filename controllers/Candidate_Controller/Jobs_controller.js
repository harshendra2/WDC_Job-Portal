const mongoose=require('mongoose');
const moment = require('moment');
const CompanyJob=require("../../models/JobSchema");

exports.getUnappliedJob = async (req, res) => {
    const { id } = req.params; 

    try {
        const jobs = await CompanyJob.find({}).populate('')

        const unappliedJobs = jobs.filter(job => 
            !job.applied_candidates.some(candidate => 
                candidate.candidate_id.toString() === id
            )
        ).map(job => {
            const timeSincePosted = moment(job.createdDate).fromNow();
            return {
                ...job._doc,
                timeSincePosted
            };
        });
        return res.status(200).send(unappliedJobs);
    } catch (error) {
        console.error(error);
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
