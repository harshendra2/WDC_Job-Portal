const express = require("express");
const router = new express.Router();
const controller=require('../../controllers/Company_Controller/Credential_controller')

router.post('/company_signup',controller.SignUp);

module.exports=router;