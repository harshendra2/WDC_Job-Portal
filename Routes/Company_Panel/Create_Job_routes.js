const express=require('express');
const router=new express.Router();
const controller=require("../../controllers/Company_Controller/Create_Job_controller");

router.get('/company/job_status/:company_id',controller.GetCreatedJobStatus);
router.post('/company/create_job/:id',controller.CreateNewJob);
router.delete('/company/Job_post/:jobId',controller.deleteJobPosted);
router.put('/company/job_Restart/:jobId',controller.RestartJobPosted);

// View Single Job application
router.get('/company/view_job/:jobId',controller.ViewJobListDetails);
//Listout Application
router.get('/company/listout_applicant/:jobId',controller.ListOutAllAppliedApplicants);
router.put('/company/sortlist/candidate/:jobId/:userId',controller.ShortlistCandidate);
//Shortlist Section
router.get('/company/listout_sortliste/applicent/:jobId',controller.ListOutAllShortlistedApplicent);
router.put('/company/add_feedback/:jobId/:userId',controller.AddUserFeedBack);
//Job offer 
router.get('/company/get_user_offer/:jobId/:userId',controller.GetUserDetailsForOffer);
router.put('/company/job_offer/:jobId/:userId',controller.OfferJobToCandidate);


module.exports=router;
