const express=require('express');
const router=new express.Router();
const controller=require("../../controllers/Company_Controller/Company_profile_Controller");

router.get('/company/profile/:id',controller.GetCompanyProfile);

module.exports=router;