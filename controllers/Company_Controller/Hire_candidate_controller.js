const mongoose = require('mongoose');
const { createObjectCsvStringifier } = require('csv-writer');
const JSZip = require('jszip');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const CompanyJob = require('../../models/JobSchema');
const candidate = require('../../models/Onboard_Candidate_Schema');
const CompanySubscription = require('../../models/Company_SubscriptionSchema');
const searchhistory = require('../../models/Search_historySchema');

exports.getAllAppliedCandidate = async (req, res) => {
    const { id } = req.params;
    try {
        const data = await candidate.aggregate([
            {
                $lookup: {
                    from: 'candidate_basic_details',
                    localField: 'basic_details',
                    foreignField: '_id',
                    as: 'basicDetails'
                }
            },
            {
                $lookup: {
                    from: 'candidate_personal_details',
                    localField: 'personal_details',
                    foreignField: '_id',
                    as: 'personalDetails'
                }
            },
            {
                $lookup: {
                    from: 'candidate_work_details',
                    localField: 'work_details',
                    foreignField: '_id',
                    as: 'workDetails'
                }
            },
            // {
            //     $lookup: {
            //         from: 'candidate_education_details',
            //         localField: 'education_details',
            //         foreignField: '_id',
            //         as: 'educationDetails'
            //     }
            // },
            {
                $lookup: {
                    from: 'currentusersubscriptionplanes',
                    localField: '_id',
                    foreignField: 'candidate_id',
                    as: 'SubscriptionPlan'
                }
            },
            {
                $unwind: {
                    path: '$SubscriptionPlan',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    basicDetails: 1,
                    personalDetails: 1,
                    workDetails: 1,
                    // educationDetails: 1,
                    profile: 1,
                    SubscriptionPlan: 1,
                    top_candidate: {
                        $cond: {
                            if: {
                                $and: [
                                    { $ne: ['$SubscriptionPlan', null] },
                                    {
                                        $gt: [
                                            '$SubscriptionPlan.expiresAt',
                                            new Date()
                                        ]
                                    }
                                ]
                            },
                            then: '$SubscriptionPlan.top_candidate',
                            else: 40
                        }
                    },
                    createdDate: '$SubscriptionPlan.createdDate'
                }
            },
            {
                $sort: { top_candidate: 1, createdDate: 1 }
            },
            {
                $project: {
                    'basicDetails.linkedIn': 0,
                    'basicDetails.email': 0,
                    'basicDetails.mobile': 0,
                    ' personalDetails.gender': 0,
                    'personalDetails.age': 0,
                    'personalDetails.marriag_status': 0,
                    'personalDetails.PAN': 0,
                    'personalDetails.aadhar_number': 0,
                    'personalDetails.father_name': 0,
                    'personalDetails.son_name': 0,
                    'workDetails.current_ctc': 0,
                    'workDetails.work_experience': 0,
                    'workDetails.skill': 0
                }
            }
        ]);

        if (data && data.length > 0) {
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            const isGoogleDriveLink = url =>
                url &&
                (url.includes('drive.google.com') ||
                    url.includes('docs.google.com'));

            const updatedData = data.map(item => {
                const resumeUrl = item.workDetails[0]?.resume
                    ? isGoogleDriveLink(item.workDetails[0]?.resume)
                        ? item.workDetails[0].resume
                        : `${baseUrl}/${item.workDetails[0].resume.replace(
                              /\\/g,
                              '/'
                          )}`
                    : null;

                const profileUrl = item?.profile
                    ? isGoogleDriveLink(item?.profile)
                        ? item?.profile
                        : `${baseUrl}/${item?.profile.replace(/\\/g, '/')}`
                    : null;

                return {
                    ...item,
                    candidateDetails: {
                        ...item.candidateDetails,
                        profile: profileUrl,
                        resume: resumeUrl
                    }
                };
            });

            return res.status(200).json(updatedData);
        } else {
            return res
                .status(404)
                .json({ error: 'No candidates found for this company' });
        }
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getCandidateDetails = async (req, res) => {
    const { userId, companyId } = req.params;

    try {
        if (!userId && !companyId) {
            return res.status(400).json({ error: 'All Id is required' });
        }
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

        if (data.length === 0) {
            return res.status(404).json({ error: 'Candidate not found' });
        }

        const candidateToUpdate = await candidate.findById(objectId);
        if (!candidateToUpdate) {
            return res.status(404).json({ error: 'Candidate not found' });
        }

        const existingCompany = candidateToUpdate.profile_view_company.find(
            company => company.company_id == companyId
        );
        if (!existingCompany) {
            candidateToUpdate.profile_view_company.push({
                company_id: companyId
            });
            await candidateToUpdate.save();
        }
        const comnId = new mongoose.Types.ObjectId(companyId);
        const existsSubscription = await CompanySubscription.findOne({
            company_id: comnId,
            expiresAt: { $gte: new Date() }
        });

        if (!existsSubscription) {
            return res.status(404).json({
                error: 'Subscription not found, please buy a new subscription plan.'
            });
        }
        if (typeof existsSubscription?.cv_view_limit == 'number') {
            existsSubscription.cv_view_limit -= 1;
            await existsSubscription.save();
        }else if(typeof existsSubscription?.cv_view_limit == 'string'){
            let count=Number( existsSubscription.cv_view_limit);
            existsSubscription.cv_view_limit=count-1;
            await existsSubscription.save();
        }

        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const isGoogleDriveLink = url => {
            return (
                url &&
                (url.includes('drive.google.com') ||
                    url.includes('docs.google.com'))
            );
        };

        const bindUrlOrPath = url => {
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

            const certificates = candidate.educationDetails.certificates.map(
                cert => ({
                    ...cert,
                    image: bindUrlOrPath(cert.image)
                })
            );

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
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.KeywordSearchCandidate = async (req, res) => {
    const { search, experience, location } = req.body;
    const { companyId } = req.params;

    try {
       if(!search&&!experience&&!location){
        const data = await candidate.aggregate([
            {
                $lookup: {
                    from: 'candidate_basic_details',
                    localField: 'basic_details',
                    foreignField: '_id',
                    as: 'basicDetails'
                }
            },
            {
                $lookup: {
                    from: 'candidate_personal_details',
                    localField: 'personal_details',
                    foreignField: '_id',
                    as: 'personalDetails'
                }
            },
            {
                $lookup: {
                    from: 'candidate_work_details',
                    localField: 'work_details',
                    foreignField: '_id',
                    as: 'workDetails'
                }
            },
            // {
            //     $lookup: {
            //         from: 'candidate_education_details',
            //         localField: 'education_details',
            //         foreignField: '_id',
            //         as: 'educationDetails'
            //     }
            // },
            {
                $lookup: {
                    from: 'currentusersubscriptionplanes',
                    localField: '_id',
                    foreignField: 'candidate_id',
                    as: 'SubscriptionPlan'
                }
            },
            {
                $unwind: {
                    path: '$SubscriptionPlan',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    basicDetails: 1,
                    personalDetails: 1,
                    workDetails: 1,
                    // educationDetails: 1,
                    profile: 1,
                    SubscriptionPlan: 1,
                    top_candidate: {
                        $cond: {
                            if: {
                                $and: [
                                    { $ne: ['$SubscriptionPlan', null] },
                                    {
                                        $gt: [
                                            '$SubscriptionPlan.expiresAt',
                                            new Date()
                                        ]
                                    }
                                ]
                            },
                            then: '$SubscriptionPlan.top_candidate',
                            else: 40
                        }
                    },
                    createdDate: '$SubscriptionPlan.createdDate'
                }
            },
            {
                $sort: { top_candidate: 1, createdDate: 1 }
            },
            {
                $project: {
                    'basicDetails.linkedIn': 0,
                    'basicDetails.email': 0,
                    'basicDetails.mobile': 0,
                    ' personalDetails.gender': 0,
                    'personalDetails.age': 0,
                    'personalDetails.marriag_status': 0,
                    'personalDetails.PAN': 0,
                    'personalDetails.aadhar_number': 0,
                    'personalDetails.father_name': 0,
                    'personalDetails.son_name': 0,
                    'workDetails.current_ctc': 0,
                    'workDetails.work_experience': 0,
                    'workDetails.skill': 0,
                }
            }
        ]);

        const comnId = new mongoose.Types.ObjectId(companyId);
        const existsSubscription = await CompanySubscription.findOne({
            company_id: comnId,
            expiresAt: { $gte: new Date() },
            createdDate:{$lte:new Date()}
        });
        if (!existsSubscription) {
            return res.status(404).json({
                error: 'Subscription not found, please purchase a new subscription plan.'
            });
        }

        if (data && data.length > 0) {
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            const isGoogleDriveLink = url =>
                url &&
                (url.includes('drive.google.com') ||
                    url.includes('docs.google.com'));

            const updatedData = data.map(item => {
                const resumeUrl = item.workDetails[0]?.resume
                    ? isGoogleDriveLink(item.workDetails[0]?.resume)
                        ? item.workDetails[0].resume
                        : `${baseUrl}/${item.workDetails[0].resume.replace(
                              /\\/g,
                              '/'
                          )}`
                    : null;

                const profileUrl = item?.profile
                    ? isGoogleDriveLink(item?.profile)
                        ? item?.profile
                        : `${baseUrl}/${item?.profile.replace(/\\/g, '/')}`
                    : null;

                return {
                    ...item,
                    candidateDetails: {
                        ...item.candidateDetails,
                        profile: profileUrl,
                        resume: resumeUrl
                    }
                };
            });

            return res.status(200).json(updatedData);
        } else {
            return res
                .status(404)
                .json({ error: 'No candidates found' });
        }
       }

        if (search) {
            var [jobTitle = '', skills = '', qualification = ''] = search
                .split(',')
                .map(param => param.trim());
        }
        let conditions = [];

        if (experience) {
            const expCondition = !isNaN(Number(experience))
                ? { 'workDetails.work_experience': Number(experience) }
                : {
                      'workDetails.work_experience': {
                          $regex: experience,
                          $options: 'i'
                      }
                  };
            conditions.push(expCondition);
        }
        if (location) {
            conditions.push({
                $or: [
                    {
                        'workDetails.current_location': {
                            $regex: location,
                            $options: 'i'
                        }
                    },
                    {
                        'workDetails.country': {
                            $regex: location,
                            $options: 'i'
                        }
                    }
                ]
            });
        }

        if (skills || jobTitle || qualification) {
            conditions.push({
                $or: [
                    {
                        $and: [
                            {
                                'workDetails.aspiring_position': {
                                    $regex: skills,
                                    $options: 'i'
                                }
                            },
                            {
                                'workDetails.aspiring_position': {
                                    $regex: jobTitle,
                                    $options: 'i'
                                }
                            },
                            {
                                'workDetails.aspiring_position': {
                                    $regex: qualification,
                                    $options: 'i'
                                }
                            }
                        ]
                    },
                    {
                        $and: [
                            {
                                'workDetails.skill': {
                                    $regex: skills,
                                    $options: 'i'
                                }
                            },
                            {
                                'workDetails.skill': {
                                    $regex: jobTitle,
                                    $options: 'i'
                                }
                            },
                            {
                                'workDetails.skill': {
                                    $regex: qualification,
                                    $options: 'i'
                                }
                            }
                        ]
                    },
                    {
                        $and: [
                            {
                                'educationDetails.highest_education': {
                                    $regex: skills,
                                    $options: 'i'
                                }
                            },
                            {
                                'educationDetails.highest_education': {
                                    $regex: jobTitle,
                                    $options: 'i'
                                }
                            },
                            {
                                'educationDetails.highest_education': {
                                    $regex: qualification,
                                    $options: 'i'
                                }
                            }
                        ]
                    },
                    {
                        $and: [
                            {
                                'workDetails.skill': {
                                    $regex: skills,
                                    $options: 'i'
                                }
                            },
                            {
                                'workDetails.aspiring_position': {
                                    $regex: jobTitle,
                                    $options: 'i'
                                }
                            },
                            {
                                'educationDetails.highest_education': {
                                    $regex: qualification,
                                    $options: 'i'
                                }
                            }
                        ]
                    }
                ]
            });
        }
        const query = conditions.length > 0 ? { $and: conditions } : {};
        const data = await candidate.aggregate([
            {
                $lookup: {
                    from: 'candidate_basic_details',
                    localField: 'basic_details',
                    foreignField: '_id',
                    as: 'basicDetails'
                }
            },
            {
                $lookup: {
                    from: 'candidate_personal_details',
                    localField: 'personal_details',
                    foreignField: '_id',
                    as: 'personalDetails'
                }
            },
            {
                $lookup: {
                    from: 'candidate_work_details',
                    localField: 'work_details',
                    foreignField: '_id',
                    as: 'workDetails'
                }
            },
            // {
            //     $lookup: {
            //         from: 'candidate_education_details',
            //         localField: 'education_details',
            //         foreignField: '_id',
            //         as: 'educationDetails'
            //     }
            // },
            {
                $lookup: {
                    from: 'currentusersubscriptionplanes',
                    localField: '_id',
                    foreignField: 'candidate_id',
                    as: 'SubscriptionPlan'
                }
            },
            {
                $unwind: {
                    path: '$workDetails',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $unwind: {
                    path: '$educationDetails',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $unwind: {
                    path: '$SubscriptionPlan',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    basicDetails: 1,
                    personalDetails: 1,
                    workDetails: 1,
                    //educationDetails: 1,
                    profile: 1,
                    SubscriptionPlan: 1,
                    top_candidate: {
                        $cond: {
                            if: {
                                $and: [
                                    { $ne: ['$SubscriptionPlan', null] },
                                    {
                                        $gt: [
                                            '$SubscriptionPlan.expiresAt',
                                            new Date()
                                        ]
                                    }
                                ]
                            },
                            then: '$SubscriptionPlan.top_candidate',
                            else: 40
                        }
                    },
                    createdDate: '$SubscriptionPlan.createdDate'
                }
            },
            { $match: query },
            { $sort: { top_candidate: 1, createdDate: 1 } },
            {
                $project: {
                    'basicDetails.linkedIn': 0,
                    'basicDetails.email': 0,
                    'basicDetails.mobile': 0,
                    ' personalDetails.gender': 0,
                    'personalDetails.age': 0,
                    'personalDetails.marriag_status': 0,
                    'personalDetails.PAN': 0,
                    'personalDetails.aadhar_number': 0,
                    'personalDetails.father_name': 0,
                    'personalDetails.son_name': 0,
                    'workDetails.current_ctc': 0,
                    'workDetails.work_experience': 0,
                    'workDetails.skill': 0,
                    'workDetails.Experience': 0
                }
            }
        ]);

        const comnId = new mongoose.Types.ObjectId(companyId);
        const existsSubscription = await CompanySubscription.findOne({
            company_id: comnId,
            expiresAt: { $gte: new Date() },
            createdDate:{$lte:new Date()}
        });
        if (!existsSubscription) {
            return res.status(404).json({
                error: 'Subscription not found, please purchase a new subscription plan.'
            });
        }
        let searchArray = [];
        if (search) searchArray.push(search);
        if (experience) searchArray.push(experience);
        if (location) searchArray.push(location);
        const searchString = searchArray.join(',');
        const historyData = new searchhistory({
            Company_id: companyId,
            Search_text: searchString
        });

        if (
            typeof existsSubscription.search_limit == 'number' &&
            existsSubscription.search_limit > 0
        ) {
            existsSubscription.search_limit -= 1;
            await Promise.all([historyData.save(), existsSubscription.save()]);
        } else if (
            typeof existsSubscription.search_limit == 'number' &&
            existsSubscription.search_limit < 0
        ) {
            return res.status(404).json({ error: 'Please top up your plan.' });
        }else if(typeof existsSubscription.search_limit == 'string' &&
            existsSubscription.search_limit !='0'){
                let count = Number(existsSubscription.search_limit);
                existsSubscription.search_limit = count - 1;
                await existsSubscription.save();
        } else {
            await historyData.save();
        }
        if (data && data.length > 0) {
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            const isGoogleDriveLink = url =>
                url &&
                (url.includes('drive.google.com') ||
                    url.includes('docs.google.com'));

            const updatedData = data.map(item => {
                 const resumeUrl = item?.workDetails[0]?.resume
                    ? isGoogleDriveLink(item.workDetails[0]?.resume)
                        ? item.workDetails[0].resume
                        : `${baseUrl}/${item.workDetails[0].resume.replace(
                              /\\/g,
                              '/'
                          )}`
                    : null;
                const profileUrl = item?.profile
                    ? isGoogleDriveLink(item?.profile)
                        ? item?.profile
                        : `${baseUrl}/${item?.profile.replace(/\\/g, '/')}`
                    : null;

                return {
                    ...item,
                    candidateDetails: {
                        ...item.candidateDetails,
                        profile: profileUrl,
                        resume: resumeUrl
                    }
                };
            });

            return res.status(200).json(updatedData);
        } else {
            return res
                .status(404)
                .json({ error: 'No candidates found' });
        }
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
};


exports.DownloadMultipleEmailId = async (req, res) => {
    const { companyId } = req.params;
    const { selectedCandidates } = req.body;

    try {
        if (!companyId) {
            return res.status(400).json({ error: 'Company ID is required' });
        }

        const objectId = new mongoose.Types.ObjectId(companyId);
        const candidateIds = selectedCandidates.map(id => new mongoose.Types.ObjectId(id));

        // Aggregating candidate data
        const data = await candidate.aggregate([
            {
                $match: {
                    _id: { $in: candidateIds }
                }
            },
            {
                $lookup: {
                    from: 'candidate_basic_details',
                    localField: 'basic_details',
                    foreignField: '_id',
                    as: 'basicDetails'
                }
            },
            { $unwind: '$basicDetails' }
        ]);

        if (!data || data.length === 0) {
            return res.status(404).json({ error: 'No candidates found' });
        }

        // Extract unique emails and names
        const uniqueEmails = [...new Set(data.map(candidate => ({
            email: candidate.basicDetails.email,
            name: candidate.basicDetails.name
        })))];

        // Generate CSV content
        const csvHeader = "Email,Name\n";  // Corrected header for separate email and name columns
        const csvRows = uniqueEmails.map(candidate => `${candidate.email},${candidate.name}`).join('\n');
        const csvData = csvHeader + csvRows;

        // Send the CSV file as response
        res.header('Content-Type', 'text/csv');
        res.attachment('selected_emails.csv');
        res.send(csvData);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};


exports.DownloadMultipleResume = async (req, res) => {
    const { companyId } = req.params;
    const { selectedCandidates } = req.body;

    try {
        if (!companyId) {
            return res.status(400).json({ error: "Company Id is required" });
        }

        const objectId = new mongoose.Types.ObjectId(companyId);
        const candidateIds = selectedCandidates?.map(id => new mongoose.Types.ObjectId(id));

        const data = await candidate.aggregate([
            {
                $match: {
                    _id: { $in: candidateIds }
                }
            },
            {
                $lookup: {
                    from: 'candidate_work_details',
                    localField: 'work_details',
                    foreignField: '_id',
                    as: 'WorkDetails'
                }
            },
            { $unwind: '$WorkDetails' },
            {
                $lookup: {
                    from: 'candidate_basic_details',
                    localField: 'basic_details',
                    foreignField: '_id',
                    as: 'BasicDetails'
                }
            },
            { $unwind: '$BasicDetails' }
        ]);

        if (!data || data.length === 0) {
            return res.status(404).json({ error: 'No candidates found' });
        }

        const resumes = data.map(candidate => ({
            resumeUrl: candidate.WorkDetails.resume,
            Name: candidate.BasicDetails.name
        }));

        const zip = new JSZip();

        for (const resume of resumes) {
            if (resume.resumeUrl) {
                let fileContent;

                if (resume.resumeUrl.includes('drive.google.com')) {
                    const fileId = extractGoogleDriveFileId(resume.resumeUrl);
                    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

                    try {
                        const response = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
                        fileContent = response.data;
                    } catch (err) {
                        console.log(`Failed to download from Google Drive: ${resume.resumeUrl}`);
                        continue;
                    }
                } else {
                    const fileName = path.basename(resume.resumeUrl); 
                    const filePath = path.join(__dirname, '../../Images', fileName);

                    if (fs.existsSync(filePath)) {
                        fileContent = await fs.promises.readFile(filePath);
                    } else {
                        console.log(`File not found: ${filePath}`);
                        continue;
                    }
                }

                const fileName = `${resume.Name}.pdf`;
                zip.file(fileName, fileContent);
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

// Function to extract Google Drive file ID from URL
function extractGoogleDriveFileId(url) {
    const regex = /\/d\/(.*?)\//;
    const match = url.match(regex);
    return match ? match[1] : null;
}

exports.getSubscriptionCountStatus=async(req,res)=>{
    const {companyId}=req.params;
    try{
        if(!companyId){
            return res.status(400).json({error:"Company Id is required"});
        }
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
          return res.status(404).json({ error: "No subscription data found" });
        }
    }catch(error){
        console.log(error);
        return res.status(500).json({error:"Internal server error"});
    }
}

exports.DownloadSingleFiles = async (req, res) => {
    const {url } = req.query;
    const isGoogleDriveLink = /^https:\/\/drive\.google\.com/.test(url);
    try {
      if (isGoogleDriveLink) {
        const fileId = url.split('/d/')[1]?.split('/')[0];
        if (!fileId) {
          return res.status(400).json({ error: "Invalid Google Drive URL." });
        }
  
        const googleDriveUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

        const response = await axios({
          url: googleDriveUrl,
          method: 'GET',
          responseType: 'stream',
        });
        res.setHeader('Content-Disposition', 'attachment; filename="resume.pdf"');
        response.data.pipe(res);
  
      } else {
        const file = url.split('/Images/')[1]?.split('/')[0];
        const filePath = path.join(__dirname, '../../Images', file);
        return res.download(filePath, (err) => {
          if (err) {
            return res.status(500).send("Could not download the file.");
          }
        });
      }
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  };