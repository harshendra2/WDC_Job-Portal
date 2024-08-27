const mongoose=require("mongoose");
const CompanyJob=require('../../models/JobSchema');
const candidate=require('../../models/Onboard_Candidate_Schema');

exports.getAllAppliedCandidate = async (req, res) => {
  const { id } = req.params;
  try {
      const objectId = new mongoose.Types.ObjectId(id);
      const data = await CompanyJob.aggregate([
          { $match: { company_id: objectId } },
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
          { $unwind: '$educationDetails' }
      ]);

      if (data && data.length > 0) {
          const baseUrl = `${req.protocol}://${req.get('host')}`;
          const isGoogleDriveLink = (url) => {
              return url && (url.includes('drive.google.com') || url.includes('docs.google.com'));
          };
          const updatedData = data.map(item => {
              const resumeUrl = item.workDetails.resume
                  ? (isGoogleDriveLink(item.workDetails.resume) ? item.workDetails.resume : `${baseUrl}/${item.workDetails.resume.replace(/\\/g, '/')}`)
                  : null;

              return {
                  ...item,
                  workDetails: {
                      ...item.workDetails,
                      resume: resumeUrl
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
  const { id, userId } = req.params;
  try {
      // Validate the candidate ID
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

          // Helper function to check if a URL is a Google Drive link
          const isGoogleDriveLink = (url) => {
              return url && (url.includes('drive.google.com') || url.includes('docs.google.com'));
          };

          // Map over the data to update the Resume URL
          const updatedData = data.map(candidate => {
              const resumeUrl = candidate.workDetails.resume
                  ? (isGoogleDriveLink(candidate.workDetails.resume)
                      ? candidate.workDetails.resume
                      : `${baseUrl}/${candidate.workDetails.resume.replace(/\\/g, '/')}`)
                  : null;

              return {
                  ...candidate,
                  workDetails: {
                      ...candidate.workDetails,
                      resume: resumeUrl
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

const parseSearchQuery = (query) => {
    const experiencePattern = /(\d+)\s*(?:year|years|yr|yrs)/i;
    const skillPattern = /\b([a-zA-Z]+\.[a-zA-Z]+|[a-zA-Z]+)/g; // Matches "Node.js", "React", etc.

    const experienceMatch = query.match(experiencePattern);
    const skillsMatch = query.match(skillPattern);

    const experience = experienceMatch ? parseInt(experienceMatch[1]) : null;
    const skills = skillsMatch ? skillsMatch.map(skill => skill.toLowerCase()) : [];

    return { experience, skills };
};


exports.KeywordSearchCandidate = async (req, res) => {
    const { id } = req.params;
    const query = req.query.query || "";  
    if (!query) {
        return res.status(400).json({ error: "Query parameter is missing" });
    }

    try {
        const objectId = new mongoose.Types.ObjectId(id);
        const { experience, skills } = parseSearchQuery(query);
        const matchConditions = { company_id: objectId };

        if (experience) matchConditions['workDetails.work_experience'] = { $gte: experience };
        if (skills.length > 0) matchConditions['workDetails.skills'] = { $all: skills.map(skill => new RegExp(skill, 'i')) };

        const data = await CompanyJob.aggregate([
            { $match: { company_id: objectId } },
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
                    ...(experience && { 'workDetails.work_experience': { $gte: experience } }),
                    // ...(skills.length > 0 && { 'workDetails.skills': { $all: skills.map(skill => new RegExp(skill, 'i')) } })
                }
            }
        ]);

        if (data && data.length > 0) {
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            const isGoogleDriveLink = (url) => url && (url.includes('drive.google.com') || url.includes('docs.google.com'));
            const updatedData = data.map(item => ({
                ...item,
                workDetails: {
                    ...item.workDetails,
                    resume: item.workDetails.resume ? (isGoogleDriveLink(item.workDetails.resume) ? item.workDetails.resume : `${baseUrl}/${item.workDetails.resume.replace(/\\/g, '/')}`) : null
                }
            }));

            return res.status(200).json(updatedData);
        } else {
            return res.status(404).json({ error: "No candidates found for this company" });
        }

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
