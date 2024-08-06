const express=require('express');
const router=new express.Router();
const controller=require('../controllers/Admin_Subscription_Controller');

router.get('/admin/get_subscription',controller.getallsubscription);
router.get('/admin/get_singlesubscription/:id',controller.getSingleSubscription)
router.put('/admin/edit_subscription/:id',controller.editSubscriptionPlane)

module.exports=router;