const mongoose=require("mongoose");
const { createObjectCsvStringifier } = require('csv-writer');
const JSZip = require('jszip');
const path = require('path');
const fs = require('fs');
const axios=require('axios')
const CompanyJob=require('../../models/JobSchema');
const candidate=require('../../models/Onboard_Candidate_Schema');
const CompanySubscription=require('../../models/Company_SubscriptionSchema');

exports.getAllAppliedCandidate = async (req, res) => {
    const { id } = req.params;
    try {
        const objectId = new mongoose.Types.ObjectId(id);

        const data = await CompanyJob.aggregate([
            { $match: { company_id: objectId } },
            { $unwind: '$applied_candidates' },
            {
                $lookup: {
                    from: 'candidates',
                    localField: 'applied_candidates.candidate_id',
                    foreignField: '_id',
                    as: 'candidateDetails'
                }
            },
            { $unwind: '$candidateDetails' },
            {
                $lookup: {
                    from: 'candidate_basic_details',
                    localField: 'candidateDetails.basic_details',
                    foreignField: '_id',
                    as: 'basicDetails'
                }
            },
            {
                $lookup: {
                    from: 'candidate_personal_details',
                    localField: 'candidateDetails.personal_details',
                    foreignField: '_id',
                    as: 'personalDetails'
                }
            },
            {
                $lookup: {
                    from: 'candidate_work_details',
                    localField: 'candidateDetails.work_details',
                    foreignField: '_id',
                    as: 'workDetails'
                }
            },
            {
                $lookup: {
                    from: 'candidate_education_details',
                    localField: 'candidateDetails.education_details',
                    foreignField: '_id',
                    as: 'educationDetails'
                }
            },
            {
                $group: {
                    _id: '$candidateDetails._id',
                    candidateDetails: { $first: '$candidateDetails' },
                    basicDetails: { $first: '$basicDetails' },
                    personalDetails: { $first: '$personalDetails' },
                    workDetails: { $first: '$workDetails' },
                    educationDetails: { $first: '$educationDetails' },
                }
            }
        ]);

        if (data && data.length > 0) {
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            const isGoogleDriveLink = (url) => url && (url.includes('drive.google.com') || url.includes('docs.google.com'));

            const updatedData = data.map(item => {
                const resumeUrl = item.workDetails?.resume
                    ? (isGoogleDriveLink(item.workDetails.resume) ? item.workDetails.resume : `${baseUrl}/${item.workDetails.resume.replace(/\\/g, '/')}`)
                    : null;

                const profileUrl = item.candidateDetails?.profile
                    ? (isGoogleDriveLink(item.candidateDetails.profile) ? item.candidateDetails.profile : `${baseUrl}/${item.candidateDetails.profile.replace(/\\/g, '/')}`)
                    : null;

                return {
                    ...item,
                    workDetails: {
                        ...item.workDetails,
                        resume: resumeUrl
                    },
                    candidateDetails: {
                        ...item.candidateDetails,
                        profile: profileUrl
                    }
                };
            });

            return res.status(200).json(updatedData);
        } else {
            return res.status(404).json({ error: "No candidates found for this company" });
        }
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
};





exports.getCandidateDetails = async (req, res) => {
    const { userId } = req.params;
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ error: 'Invalid candidate ID' });
      }
  
      const objectId = new mongoose.Types.ObjectId(userId);
      const data = await candidate.aggregate([
        { $match: { _id: objectId } },
        {
          $lookup: {
            from: 'candidate_basic_details',
            localField: 'basic_details',
            foreignField: '_id',
            as: 'basicDetails'
          }
        },
        { $unwind: '$basicDetails' },
        {
          $lookup: {
            from: 'candidate_personal_details',
            localField: 'personal_details',
            foreignField: '_id',
            as: 'personalDetails'
          }
        },
        { $unwind: '$personalDetails' },
        {
          $lookup: {
            from: 'candidate_work_details',
            localField: 'work_details',
            foreignField: '_id',
            as: 'workDetails'
          }
        },
        { $unwind: '$workDetails' },
        {
          $lookup: {
            from: 'candidate_education_details',
            localField: 'education_details',
            foreignField: '_id',
            as: 'educationDetails'
          }
        },
        { $unwind: '$educationDetails' }
      ]);
  
      if (data.length > 0) {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const isGoogleDriveLink = (url) => {
          return url && (url.includes('drive.google.com') || url.includes('docs.google.com'));
        };
  
        const bindUrlOrPath = (url) => {
          return isGoogleDriveLink(url)
            ? url
            : `${baseUrl}/${url.replace(/\\/g, '/')}`;
        };
  
        const updatedData = data.map(candidate => {
          const resumeUrl = candidate.workDetails.resume
            ? bindUrlOrPath(candidate.workDetails.resume)
            : null;
  
          const profileUrl = candidate?.profile
            ? bindUrlOrPath(candidate?.profile)
            : null;

  
          const certificates = candidate.educationDetails.certificates.map(cert => ({
            ...cert,
            image: bindUrlOrPath(cert.image)
          }));
  
          return {
            ...candidate,
            profile: profileUrl,
            workDetails: {
              ...candidate.workDetails,
              resume: resumeUrl
            },
           
            educationDetails: {
              ...candidate.educationDetails,
              certificates
            }
          };
        });
  
        return res.status(200).json(updatedData[0]);
      } else {
        return res.status(404).json({ error: "Candidate not found" });
      }
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  };
  


// Key word Search Features
exports.KeywordSearchCandidate = async (req, res) => {
    const { id } = req.params;
const {job_profile,experience,location,skill,qalification}=req.body

    if (!query) {
        return res.status(400).json({ error: "Query parameter is missing" });
    }

    try {
        const objectId = new mongoose.Types.ObjectId(id);

        // Construct match conditions for the company's job postings
        const matchConditions = { company_id: objectId };

        // Perform the aggregation to retrieve and filter candidate data
        const data = await CompanyJob.aggregate([
            { $match: matchConditions },
            {
                $lookup: {
                    from: 'candidates',
                    localField: 'candidate_id',
                    foreignField: '_id',
                    as: 'candidateDetails'
                }
            },
            { $unwind: '$candidateDetails' },
            {
                $lookup: {
                    from: 'candidate_basic_details',
                    localField: 'candidateDetails.basic_details',
                    foreignField: '_id',
                    as: 'basicDetails'
                }
            },
            { $unwind: '$basicDetails' },
            {
                $lookup: {
                    from: 'candidate_personal_details',
                    localField: 'candidateDetails.personal_details',
                    foreignField: '_id',
                    as: 'personalDetails'
                }
            },
            { $unwind: '$personalDetails' },
            {
                $lookup: {
                    from: 'candidate_work_details',
                    localField: 'candidateDetails.work_details',
                    foreignField: '_id',
                    as: 'workDetails'
                }
            },
            { $unwind: '$workDetails' },
            {
                $lookup: {
                    from: 'candidate_education_details',
                    localField: 'candidateDetails.education_details',
                    foreignField: '_id',
                    as: 'educationDetails'
                }
            },
            { $unwind: '$educationDetails' },
            {
                $match: {
                    $or: [
                        { 'workDetails.designation': { $regex: query, $options: 'i' } },
                        //{ 'workDetails.work_experience': { $regex: query, $options: 'i' } },
                        //{ 'basicDetails.name': { $regex: query, $options: 'i' } }, // Example for name search
                        //{ 'personalDetails.location': { $regex: query, $options: 'i' } } // Example for location search
                    ]
                }
            }
        ]);

        if (data.length > 0) {
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            const isGoogleDriveLink = (url) => url && (url.includes('drive.google.com') || url.includes('docs.google.com'));
            
            const updatedData = data.map(item => ({
                ...item,
                workDetails: {
                    ...item.workDetails,
                    resume: item.workDetails.resume 
                        ? isGoogleDriveLink(item.workDetails.resume)
                            ? item.workDetails.resume
                            : `${baseUrl}/${item.workDetails.resume.replace(/\\/g, '/')}`
                        : null
                }
            }));

            return res.status(200).json(updatedData);
        } else {
            return res.status(404).json({ error: "No candidates found matching the query for this company." });
        }

    } catch (error) {
        console.error("Error in KeywordSearchCandidate:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

exports.DownloadMultipleEmailId = async (req, res) => {
    const { companyId } = req.params;
    const { selectedCandidates } = req.body;

    try {
        const objectId = new mongoose.Types.ObjectId(companyId);

        const data = await CompanyJob.aggregate([
            { $match: { company_id: objectId } },
            { $unwind: '$applied_candidates' }, 
            {
                $lookup: {
                    from: 'candidates',
                    localField: 'applied_candidates.candidate_id',
                    foreignField: '_id',
                    as: 'candidateDetails'
                }
            },
            { $match: { 'candidateDetails._id': { $in: selectedCandidates.map(id => new mongoose.Types.ObjectId(id)) } } },
            { $unwind: '$candidateDetails' },
            {
                $lookup: {
                    from: 'candidate_basic_details',
                    localField: 'candidateDetails.basic_details',
                    foreignField: '_id',
                    as: 'basicDetails'
                }
            },
            { $unwind: '$basicDetails' }
        ]).exec();

        if (!data || data.length === 0) {
            return res.status(404).json({ error: 'No candidates found' });
        }

        const uniqueEmails = [...new Set(data.map(candidate => candidate.basicDetails.email))];

        const csvHeader = "Email\n";
        const csvContent = uniqueEmails.join('\n');
        const csvData = csvHeader + csvContent;

        res.header('Content-Type', 'text/csv');
        res.attachment('selected_emails.csv');
        res.send(csvData);

    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
};


exports.DownloadMultipleResume = async (req, res) => {
    const { companyId } = req.params;
    const { selectedCandidates } = req.body;

    try {
        const objectId = new mongoose.Types.ObjectId(companyId);

        const data = await CompanyJob.aggregate([
            { $match: { company_id: objectId } },
            { $unwind: '$applied_candidates' },
            {
                $lookup: {
                    from: 'candidates',
                    localField: 'applied_candidates.candidate_id',
                    foreignField: '_id',
                    as: 'candidateDetails'
                }
            },
            { $match: { 'candidateDetails._id': { $in: selectedCandidates.map(id => new mongoose.Types.ObjectId(id)) } } },
            { $unwind: '$candidateDetails' },
            {
                $lookup: {
                    from: 'candidate_work_details',
                    localField: 'candidateDetails.work_details',
                    foreignField: '_id',
                    as: 'WorkDetails'
                }
            },
            { $unwind: '$WorkDetails' }
        ]).exec();

        if (!data || data.length === 0) {
            return res.status(404).json({ error: 'No candidates found' });
        }

        const resumes = data.map(candidate => ({
            resumeUrl: candidate.WorkDetails.resume
        }));

        const zip = new JSZip();

        for (const resume of resumes) {
            if (resume.resumeUrl) {
                if (resume.resumeUrl.includes('drive.google.com')) {
                    const fileId = extractGoogleDriveFileId(resume.resumeUrl);
                    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

                    try {
                        const response = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
                        const fileName = `resume_${fileId}.pdf`;
                        zip.file(fileName, response.data);
                    } catch (err) {
                        console.log(`Failed to download from Google Drive: ${resume.resumeUrl}`);
                    }
                } else {
                    const fileName = path.basename(resume.resumeUrl); 
                    const filePath = path.join(__dirname, '../../Images', fileName); 

                    if (fs.existsSync(filePath)) {
                        const fileContent = await fs.promises.readFile(filePath);
                        zip.file(fileName, fileContent);
                    } else {
                        console.log(`File not found: ${filePath}`);
                    }
                }
            }
        }

        const zipContent = await zip.generateAsync({ type: 'nodebuffer' });
        res.header('Content-Type', 'application/zip');
        res.attachment('selected_resumes.zip');
        res.send(zipContent);

    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

function extractGoogleDriveFileId(url) {
    const regex = /\/d\/(.*?)\//;
    const match = url.match(regex);
    return match ? match[1] : null;
}

exports.getSubscriptionCountStatus=async(req,res)=>{
    const {companyId}=req.params;
    try{
        const objectId = new mongoose.Types.ObjectId(companyId);

        const [subscriptionData, jobData] = await Promise.all([
          CompanySubscription.aggregate([
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
          CompanyJob.find({ company_id: objectId }),
        ]);
        if (subscriptionData && subscriptionData.length > 0) {
          const formattedSubscriptionData = subscriptionData.map((subscription) => {
            
            if (
              Array.isArray(subscription.topUp) &&
              subscription.topUp.length > 0
            ) {
              subscription.topUp = subscription.topUp.map((topUp) => {
                
                return topUp;
              });
            }
    
            return subscription;
          });
          
          return res.status(200).json({
            subscriptionData: formattedSubscriptionData
          });
        } else {
          returnres.status(404).json({ error: "No subscription data found" });
        }
    }catch(error){
        console.log(error);
        return res.status(500).json({error:"Internal server error"});
    }
}