const express = require("express");
const router = new express.Router();
const controller=require('../../controllers/Company_Controller/company_dashboard');

router.get('/company/dashboard_status/:id',controller.getCompanyDetails);
router.get('/company/offer_verifier/:companyId/:PAN',controller.OfferVerifier);

module.exports=router;