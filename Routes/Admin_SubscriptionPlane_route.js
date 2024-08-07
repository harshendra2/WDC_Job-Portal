const express=require('express');
const router=new express.Router();
const controller=require('../controllers/Admin_Subscription_Controller');

router.get('/admin/get_subscription',controller.getallsubscription);
router.get('/admin/get_subscription_name',controller.getAllSubscriptionName)
router.get('/admin/get_singlesubscription/:id',controller.getSingleSubscription)
router.put('/admin/edit_subscription/:id',controller.editSubscriptionPlane)
router.post('/admin/create_subscription',controller.createSubscriptionPlane)

module.exports=router;