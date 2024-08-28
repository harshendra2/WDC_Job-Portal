const express = require("express");
const router = new express.Router();
const controller=require('../../controllers/Admin_controller/Job_Listing_controller');

router.get('/admin/joblisting',controller.GetAllJobsListing);
router.get('/admin/alljobs/:id',controller.getAllJob);
router.get('/admin/getjobdescription/:jobId',controller.GetJobDescription);

//verify jobs
router.get('/admin/verifyjob_list',controller.ListOutAllJob);
router.put('/admin/verify/company_job/:jobId',controller.VerifyCompanyJobPosted);
router.put('/admin/disapprove/company_job/:jobId',controller.DisapproveJob);

module.exports=router;