const CompanyJob = require("../../models/JobSchema");
const company = require("../../models/Onboard_Company_Schema");
const mongoose = require("mongoose");

exports.GetAllJobsListing = async (req, res) => {
  try {
    const temp = await CompanyJob.aggregate([
      {
        $group: {
          _id: "$company_id",
          jobCount: { $sum: 1 }, // Count the total number of jobs per company
          activeJobCount: {
            $sum: { $cond: [{ $eq: ["$status", true] }, 1, 0] },
          }, // Count active jobs
          inactiveJobCount: {
            $sum: { $cond: [{ $eq: ["$status", false] }, 1, 0] },
          }, // Count inactive jobs
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
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getAllJob = async (req, res) => {
  const { id } = req.params;
  try {
    const objectId = new mongoose.Types.ObjectId(id);

    const data = await CompanyJob.aggregate([
      { $match: { company_id: objectId } },
    ]);

    if (data && data.length > 0) {
      return res.status(200).send(data);
    } else {
      return res.status(404).json({ error: "No jobs found for this company" });
    }
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.GetJobDescription = async (req, res) => {
  const { jobId } = req.params;
  try {
    const data = await CompanyJob.findById({ _id: jobId });
    if (data) {
      return res.status(200).send(data);
    }
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.ListOutAllJob = async (req, res) => {
  try {
    const data = await CompanyJob.aggregate([
      { $match: { admin_verify: 'pending' } },
      {
        $lookup: {
          from: 'companies', 
          localField: 'company_id',
          foreignField: '_id',
          as: 'company_details'
        }
      },
      // {$project:{
      //   company_details.name:0,

      // }}
    ]);

    if (data && data.length > 0) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const updatedData = data.map(job => {
        const companyDetails = job.company_details[0]; 
        const profileUrl = companyDetails && companyDetails.profile 
          ? (isGoogleDriveLink(companyDetails.profile) 
              ? companyDetails.profile 
              : `${baseUrl}/${companyDetails.profile.replace(/\\/g, '/')}`)
          : null;

        return {
          ...job,
          application: job.candidate_id.length,
          company_details: {
            ...companyDetails,
            profileUrl: profileUrl,
          }
        };
      });

      return res.status(200).send(updatedData);
    } else {
      return res.status(404).json({ message: "No jobs found" });
    }
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

const isGoogleDriveLink = (url) => {
  return url && (url.includes('drive.google.com') || url.includes('docs.google.com'));
};



exports.getSingleJobs=async(req,res)=>{
  const {jobId}=req.params;
  try{

  }catch(error){
    return res.status(500).json({error:"Internal server error"});
  }
}


exports.VerifyCompanyJobPosted = async (req, res) => {
  const { jobId } = req.params;

  try {
    const existedJob = await CompanyJob.findById(jobId);
    if (!existedJob) {
      return res
        .status(400)
        .json({ error: "This job does not exist in our database." });
    }
    const updatedJob = await CompanyJob.findByIdAndUpdate(
      jobId,
      { admin_verify:'verified'},
      { new: true }
    );

    if (updatedJob) {
      return res.status(200).json({ message: "Job verified successfully." });
    }
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.DisapproveJob = async (req, res) => {
  const { jobId } = req.params;
  try {
    const existedData = await CompanyJob.findById(jobId);
    if (!existedData) {
      return res
        .status(400)
        .json({ error: "This job does not exist in our database." });
    }

    const data = await CompanyJob.findByIdAndUpdate(
      jobId,
      { admin_verify:'Unverified'},
      { new: true }
    );
    if (data) {
      return res.status(200).json({ message: "Job Unverified successfully." });
    }
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};
