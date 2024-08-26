const express=require('express');
const router=new express.Router();
const controller=require('../../controllers/Company_Controller/SideBar_Controller');

router.get('/company/profile_status/:id',controller.CompanyProfileStatus);

module.exports=router;