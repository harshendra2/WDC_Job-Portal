const express = require("express");
const router = new express.Router();
const controller=require('../../controllers/Company_Controller/company_dashboard');

router.get('/company/subscription_status/:id',controller.getsubscriptionStatus);
router.get('/company/job_count/:id',controller.GetJobCreatedCount);
//upgrade Subscription plane
router.post('/company/upgrade_subscription',controller.UpgradeSubscriptionPlane);

module.exports=router;