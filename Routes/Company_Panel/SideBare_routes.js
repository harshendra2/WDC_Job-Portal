const express=require('express');
const router=new express.Router();
const controller=require('../../controllers/Company_Controller/SideBar_Controller');

router.get('/company/profile_status/:id',controller.CompanyProfileStatus);
//Green Ticks /company verify
router.get('/company/green_tick/payment',controller.CompanyGreenTicks);
 router.post('/company/green_tick/verify',controller.GreenTickVerifyPayment);


module.exports=router;