const express=require('express');
const router=new express.Router();
const controller=require('../../controllers/Admin_controller/Dashboard_controller');

router.get('/admin/dashboard',controller.getCountofCandidate);
router.get('/admin/dashboard/subscription/:calendar',controller.GetAllSubscriptionplane);

module.exports=router;