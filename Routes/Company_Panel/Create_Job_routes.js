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
router.put('/company/edit_job/:jobId',controller.EditPostedJob);

// View Single Job application
router.get('/company/view_job/:jobId',controller.ViewJobListDetails);
//Listout Application
router.get('/company/listout_applicant/:jobId',controller.ListOutAllAppliedApplicants);
router.put('/company/interview_round/candidate/:jobId/:userId',controller.ShortlistedForInterviewRound);
//Interviewed Candidate
router.get('/company/interview_round/Candidate/:jobId',controller.ListoutInterviewRoundCandidate);
router.put('/company/change_status/interview_round/:jobId/:userId',controller.ChangeInterviewStatus);

//Longlisted out
router.get('/company/listout_longlist_applicant/:jobId',controller.ListOutLonglist);
router.put('/company/add_feedback/:jobId/:userId',controller.AddUserFeedBack);

//Rejected Longlisted Candidate
router.put('/company/reject/longlist/:jobId/:userId',controller.RejectLongListCandidate);
//Shortlist Longlist Candidate
router.put('/company/sortlist/candidate/:jobId/:userId',controller.ShortlistCandidate);
//Shortlist Section
router.get('/company/listout_sortliste/applicent/:jobId',controller.ListOutAllShortlistedApplicent);

//Finalize Section
router.put('/company/reject_applicent/:jobId/:userId',controller.RejectApplicent);
//Job offer 
router.get('/company/get_user_offer/:jobId/:userId',controller.GetUserDetailsForOffer);
router.put('/company/job_offer/:jobId/:userId',upload.single('file'),controller.OfferJobToCandidate);
//hire Candidate
router.get('/company/get_user_detail/hire/:jobId/:userId',controller.GetUserDetailswithofferStatus); 

module.exports=router;
