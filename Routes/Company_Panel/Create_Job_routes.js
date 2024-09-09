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
router.get('/company/listout_applicant/:jobId',controller.ListoutAllAppliedApplicante);


module.exports=router;
