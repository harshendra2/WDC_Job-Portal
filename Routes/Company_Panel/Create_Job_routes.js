const express=require('express');
const router=new express.Router();
const controller=require("../../controllers/Company_Controller/Create_Job_controller");
const {upload}=require('../../middleware/multer');

router.get('/company/job_status/:company_id',controller.GetCreatedJobStatus);
router.get('/company/job/suggestion_description',controller.GetSuggestionJobDescription);
//Post new job
router.post('/company/create_job/:id',controller.CreateNewJob);
//promoted job 
router.get('/company/get_promoted/details',controller.GetPromotedJobDetails);
router.post('/company/promote_job/payment',controller.PromoteJobPayment);
router.post('/company/promote_job/verify',controller.CreatePromotesJob);

router.delete('/company/Job_post/:jobId',controller.deleteJobPosted);
router.put('/company/job_Restart/:jobId',controller.RestartJobPosted);
router.put('/company/restart/job/:jobId/:cmpId',controller.RestartJobOnceExpire); // Restart posted jobs if Job expired
router.put('/company/edit_job/:jobId',controller.EditPostedJob);

// View Single Job application
router.get('/company/view_job/:jobId',controller.ViewJobListDetails);
//Listout Application
router.get('/company/listout_applicant/:jobId',controller.ListOutAllAppliedApplicants);
router.put('/company/long_list/candidate/:jobId/:userId',controller.ShortlistedForInterviewRound);
//Longlist Candidate
router.get('/company/interview_round/Candidate/:jobId',controller.ListoutLongListCandidate);
router.put('/company/change_status/interview_round/:jobId/:userId',controller.ChangeInterviewStatus);

//Shortlist 
router.get('/company/shortlist_applicant/:jobId',controller.ListshortList);
router.put('/company/add_feedback/:jobId/:userId',controller.AddUserFeedBack);

//Finalize Section
router.put('/company/reject_applicent/:jobId/:userId',controller.RejectApplicent);
//Job offer 
router.get('/company/get_user_offer/:jobId/:userId',controller.GetUserDetailsForOffer);
router.put('/company/job_offer/:jobId/:userId',upload.single('file'),controller.OfferJobToCandidate);
//hire Candidate
router.get('/company/get_user_detail/hire/:jobId/:userId',controller.GetUserDetailswithofferStatus);

//Offer a offer letter to new candidate
router.post('/company/offer_letter/newcandidate/:cmpId/:jobId',upload.single('file'),controller.NewOfferLetterOfferedCandidate);

module.exports=router;
