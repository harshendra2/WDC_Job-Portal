const express = require("express");
const router = new express.Router();
const controller=require('../../controllers/Company_Controller/company_dashboard');

router.get('/company/dashboard_status/:id',controller.getCompanyDetails);
//Upgrade Subscription plane
router.get('/company/get_upgradesubcription/:companyId',controller.GetUpgradeSubscriptionPlane);
router.post('/company/upgrade_plane/payment',controller.CreateOrder);
router.post('/company/upgrade_subscription/verify',controller.SubscriptionPlaneVerifyPayment);

module.exports=router;