const express=require('express');
const router=new express.Router();
const controller=require('../../controllers/Candidate_Controller/Applied_Job_controller');

router.get('/candidate/appliedjob/:userId',controller.getAppliedJob);
router.get('/candidate/savedjob/:userId',controller.getSeavedjob);
//Job status flow map
router.get('/candidate/job_details/flow/:jobId',controller.GetjobDetails);
router.get('/candidate/application_status/flow/:jobId/:userId',controller.GetApplicationStatus);
router.put('/candidate/applicent/feed_back/:jobId/:userId',controller.AddCompanyFeedBack);
//Accept offer letter
router.put('/candidate/applicent/reject_offer/:jobId/:userId',controller.OfferLetterRejected);
//offer letter Accepted
router.put('/candidate/applicent/accept_offer/:jobId/:userId',controller.OfferLetterAccepted);

module.exports=router;