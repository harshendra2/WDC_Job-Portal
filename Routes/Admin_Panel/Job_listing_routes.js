const express = require("express");
const router = new express.Router();
const controller=require('../../controllers/Admin_controller/Job_Listing_controller');

router.get('/admin/joblisting',controller.GetAllJobsListing);


module.exports=router;