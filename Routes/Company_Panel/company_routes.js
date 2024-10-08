const express = require("express");
const router = new express.Router();
const controller=require('../../controllers/Company_Controller/Credential_controller')

router.post('/company/registration',controller.CompanyRegistration);
router.post('/company/otp',controller.getOTP);
router.post('/company/reg',controller.Registration);

router.post('/company/login',controller.Login);
router.post('/company/login_otp',controller.CompanyOTP);

router.post('/company/forgotpassword',controller.forgotPassword);
router.post('/company/newpassword',controller.NewPassowrd)

router.post('/company/logout',controller.CompanyLogOut);

module.exports=router;