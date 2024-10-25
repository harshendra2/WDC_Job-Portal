const CompanyJob = require("../../models/JobSchema");
const company = require("../../models/Onboard_Company_Schema");
const mongoose = require("mongoose");
const moment=require('moment');

exports.GetAllJobsListing = async (req, res) => {
  try {
    const temp = await CompanyJob.aggregate([
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
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.GetVerifyAndReportingCount=async(req,res)=>{
  try{

    const verifiedCount = await CompanyJob.aggregate([
      { $match: { admin_verify: 'pending' } },
      {
        $lookup: {
          from: 'companies',
          localField: 'company_id',
          foreignField: '_id',
          as: 'company_details'
        }
      }
    ])
    const verifyjobCount=verifiedCount.length

    const reportingCount = await CompanyJob.aggregate([
      {
        $match: {
          job_reporting: { $exists: true, $ne: [] }
        }
      }   
    ])
    const reportingjobcount=reportingCount.length
    return res.status(200).json({verifyjobCount,reportingjobcount})
  }catch(error){
    return res.status(500).json({error:"Internal server error"});
  }
}

exports.getAllJob = async (req, res) => {
  const { id } = req.params;
  
  try {
    const objectId = new mongoose.Types.ObjectId(id);

    const data = await CompanyJob.aggregate([
      { $match: { company_id: objectId } },
      {
        $lookup: {
          from: 'companies',
          localField: 'company_id',
          foreignField: '_id',
          as: 'company'
        }
      },
      {$project:{
        'company.company_name':1,
        'company.profile':1,
        job_title:1,
        experience:1,
        location:1,
        salary:1,
        education:1,
        createdDate:1,
        applied_candidates:1,
        Green_Batch:1

      }}
    ]);

    if (data && data.length > 0) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const updatedData = data.map(job => {
        const companyDetails = job.company[0]; // Extract company details from the lookup
        const profileUrl = companyDetails && companyDetails.profile 
          ? (isGoogleDriveLink(companyDetails.profile) 
              ? companyDetails.profile 
              : `${baseUrl}/${companyDetails.profile.replace(/\\/g, '/')}`)
          : null;

        return {
          ...job,
          timeSincePosted: job.createdDate ? moment(job.createdDate).fromNow() : 'N/A', // Safely handle createdDate
          application: job.applied_candidates ? job.applied_candidates.length : 0, // Handle candidate_id safely
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
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};


exports.GetJobDescription = async (req, res) => {
  const { jobId } = req.params;
  try {
    const data = await CompanyJob.findById(jobId).populate('company_id');
    
    if (data) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;

      const companyDetails = data.company_id; // Populated company details
      const profileUrl = companyDetails && companyDetails.profile 
        ? (isGoogleDriveLink(companyDetails.profile) 
            ? companyDetails.profile 
            : `${baseUrl}/${companyDetails.profile.replace(/\\/g, '/')}`)
        : null;

      const updatedData = {
        ...data._doc, // Spread the original data
        timeSincePosted: moment(data.createdDate).fromNow(),
        application: data.applied_candidates.length,
        company_details: {
          ...companyDetails._doc,
          profileUrl: profileUrl,
        },
      };

      return res.status(200).send(updatedData);
    } else {
      return res.status(404).json({ message: "No jobs found" });
    }
  } catch (error) {
    console.log(error)
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
      }
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
          timeSincePosted:moment(job.createdDate).fromNow(),
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
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const isGoogleDriveLink = (url) => {
  return url && (url.includes('drive.google.com') || url.includes('docs.google.com'));
};



exports.getSingleJobs=async(req,res)=>{
  const {jobId}=req.params;
  try{
    const objectId = new mongoose.Types.ObjectId(jobId);
     const data=await CompanyJob.aggregate([
      {$match:{_id:objectId}},
      {$lookup: {
        from: 'companies',
        localField: 'company_id',
        foreignField: '_id',
        as: 'company_details'
      }}
    ])
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
          timeSincePosted:moment(job.createdDate).fromNow(),
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

  }catch(error){
    console.log(error);
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


//Report job 
exports.GetAllReportedJobs = async (req, res) => {
  try {
    const reportingData = await CompanyJob.aggregate([
      {
        $match: {
          job_reporting: { $exists: true, $ne: [] }
        }
      },
      {
        $lookup: {
          from: 'companies',
          localField: 'company_id',
          foreignField: '_id',
          as: 'company_details'
        }
      },
      {
        $unwind: {
          path: '$company_details',
          preserveNullAndEmptyArrays: true 
        }
      }
    ]).sort({reported_date: -1 });

    if (reportingData && reportingData.length > 0) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const isGoogleDriveLink = (url) => {
        return url && (url.includes('drive.google.com') || url.includes('docs.google.com'));
      };

      const updatedData = reportingData.map(job => {
        const companyDetails = job.company_details || {}; 
        const profileUrl = companyDetails.profile 
          ? (isGoogleDriveLink(companyDetails.profile) 
              ? companyDetails.profile 
              : `${baseUrl}/${companyDetails.profile.replace(/\\/g, '/')}`)
          : null;

        return {
          ...job,
          timeSincePosted:moment(job.createdDate).fromNow(),
          application: job.candidate_id.length,
          reportingCount:job.job_reporting.length,
          company_details: {
            ...companyDetails,
            profileUrl: profileUrl,
          }
        };
      });

      return res.status(200).send(updatedData);
    } else {
      return res.status(404).json({ message: "No reported jobs found" });
    }

  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.ReportingjobtoAdmin=async(req,res)=>{
  const {jobId}=req.params;
  try{
    const objectId = new mongoose.Types.ObjectId(jobId);
    const reportingData = await CompanyJob.aggregate([
      {
        $match: {_id:objectId}
      },
      {
        $lookup: {
          from: 'companies',
          localField: 'company_id',
          foreignField: '_id',
          as: 'company_details'
        }
      },
      {
        $lookup:{
          from:'candidates',
          localField:'job_reporting.candidate_id',
          foreignField:'_id',
          as:"Candidate_details"
        }
      },
      {
        $unwind: {
          path: '$company_details',
          preserveNullAndEmptyArrays: true 
        }
      }
    ]);

    if (reportingData && reportingData.length > 0) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const isGoogleDriveLink = (url) => {
        return url && (url.includes('drive.google.com') || url.includes('docs.google.com'));
      };

      const updatedData = reportingData.map(job => {
        const companyDetails = job.company_details || {}; 
        const profileUrl = companyDetails.profile 
          ? (isGoogleDriveLink(companyDetails.profile) 
              ? companyDetails.profile 
              : `${baseUrl}/${companyDetails.profile.replace(/\\/g, '/')}`)
          : null;

        return {
          ...job,
          timeSincePosted:moment(job.createdDate).fromNow(),
          application: job.candidate_id.length,
          reportingCount:job.job_reporting.length,
          company_details: {
            ...companyDetails,
            profileUrl: profileUrl,
          }
        };
      });

      return res.status(200).send(updatedData);
    } else {
      return res.status(404).json({ message: "No reported jobs found" });
    }
  }catch(error){
    return res.status(500).json({error:"Internal server error"});
  }
}



exports.DeleteReportedJob=async(req,res)=>{
  const {jobId}=req.params;
  try{
    const deleteJob = await CompanyJob.findByIdAndDelete(jobId);

    if (deleteJob) {
      return res.status(200).json({ message: "Job deleted successfully" });
    } else {
      return res.status(404).json({ error: "Job not found in the database" });
    }

  }catch(error){
    return res.status(500).json({error:"Internal server error"});
  }
}