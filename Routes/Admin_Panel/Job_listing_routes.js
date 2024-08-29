const express = require("express");
const router = new express.Router();
const controller=require('../../controllers/Admin_controller/Job_Listing_controller');

router.get('/admin/joblisting',controller.GetAllJobsListing);
router.get('/admin/getverifyand_reportingCount',controller.GetVerifyAndReportingCount);
router.get('/admin/alljobs/:id',controller.getAllJob);
router.get('/admin/getjobdescription/:jobId',controller.GetJobDescription);

//verify jobs
router.get('/admin/verifyjob_list',controller.ListOutAllJob);
router.get('/admin/verifyjob_list/single/:jobId',controller.getSingleJobs);
router.put('/admin/verify/company_job/:jobId',controller.VerifyCompanyJobPosted);
router.put('/admin/disapprove/company_job/:jobId',controller.DisapproveJob);

//Reporting jobs
router.get('/admin/job_report',controller.GetAllReportedJobs);
router.get('/admin/job_report/single_details/:jobId',controller.ReportingjobtoAdmin);
router.delete('/admin/job_report/delete/:jobId',controller.DeleteReportedJob);

module.exports=router;