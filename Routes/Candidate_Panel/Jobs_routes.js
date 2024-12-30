const express=require("express");
const router=new express.Router();
const controller=require('../../controllers/Candidate_Controller/Jobs_controller');

router.post('/candidate/job_search/:userId',controller.KeywordJobSearch);
router.get('/candidate/getunappliedjob/:id/:page/:limit',controller.getUnappliedJob);
router.get('/candidate/getjobdetails/:id',controller.getJobDetails);
router.get('/candidate/company_details/:companyId',controller.GetCompanyDetails);
router.get('/candidate/basic_details/:companyId',controller.GetCompanyBasicDetails);
router.get('/candidate/posted_jobs/company/:companyId/:userId',controller.GetAllJobpostedByCompany);
router.get('/candidate/company/review/:companyId',controller.GetAllCompanyReveiw);

router.post('/candidate/jobapply/:userId/:jobId',controller.applyToJob);

//Saved Jobs
router.post('/candidate/savejob/:userId/:jobId',controller.saveJob)


module.exports=router;