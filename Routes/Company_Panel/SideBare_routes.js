const express=require('express');
const router=new express.Router();
const controller=require('../../controllers/Company_Controller/SideBar_Controller');

//Green Batch /company verify
router.post('/company/green_tick/payment',controller.CompanyGreenTicks);
 router.post('/company/green_tick/verify',controller.GreenTickVerifyPayment);
 router.get('/company/get/green_batch',controller.GetallGreenBatch);

module.exports=router;