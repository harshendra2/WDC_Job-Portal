const express=require('express');
const router=new express.Router();
const controller=require('../../controllers/Company_Controller/Hire_candidate_controller');

router.get('/company/get_appliedcandidate/:id',controller.getAllAppliedCandidate);
router.get('/company/get_candidatedetails/:userId',controller.getCandidateDetails);
//search Features
router.get('/company/get_searchcandiate/:id',controller.KeywordSearchCandidate);
//Download Email
router.post('/company/download_email/:companyId',controller.DownloadMultipleEmailId);
//Download Resume
router.post('/company/download_resume/:companyId',controller.DownloadMultipleResume);

module.exports=router;
