const express = require("express");
const router = new express.Router();
const controller=require('../../controllers/Admin_controller/Job_Listing_controller');

router.get('/admin/joblisting',controller.GetAllJobsListing);
router.get('/admin/alljobs/:id',controller.getAllJob);
router.get('/admin/getjobdescription/:jobId',controller.GetJobDescription);


module.exports=router;