const express = require("express");
const router = new express.Router();
const controller=require('../../controllers/Company_Controller/Credential_controller')

router.post('/company_otp',controller.getOTP)
router.post('/company_reg',controller.Registration)
router.post('/company_login',controller.Login)

module.exports=router;