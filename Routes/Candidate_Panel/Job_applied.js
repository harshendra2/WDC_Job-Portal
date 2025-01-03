const express=require('express');
const router=new express.Router();
const controller=require('../../controllers/Candidate_Controller/Applied_Job_controller');

router.get('/candidate/appliedjob/:userId/:page/:limit/:filter',controller.getAppliedJob);
router.get('/candidate/savedjob/:userId/:page/:limit',controller.getSeavedjob);
//Job status flow map
router.get('/candidate/job_details/flow/:jobId',controller.GetjobDetails);
router.get('/candidate/application_status/flow/:jobId/:userId',controller.GetApplicationStatus);
router.put('/candidate/applicent/feed_back/:jobId/:userId',controller.AddCompanyFeedBack);
//Accept offer letter
router.put('/candidate/applicent/reject_offer/:jobId/:userId',controller.OfferLetterRejected);
//offer letter Accepted
router.put('/candidate/applicent/accept_offer/:jobId/:userId',controller.OfferLetterAccepted);
//Second time offer letter Reject
router.get('/candidate/offer/reject/otp/:jobId/:userId',controller.GetOfferRejectOTP);
router.put('/candidate/offer/rejected/otp/confirm/:jobId/:userId',controller.VerifyOfferOTP);

module.exports=router;