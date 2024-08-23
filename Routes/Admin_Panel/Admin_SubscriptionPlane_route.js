const express=require('express');
const router=new express.Router();
const controller=require('../../controllers/Admin_controller/Admin_Subscription_Controller');

//Subscription Plane
router.get('/admin/get_subscription',controller.getallsubscription);
router.get('/admin/get_subscription_name',controller.getAllSubscriptionName)
router.get('/admin/get_singlesubscription/:id',controller.getSingleSubscription)
router.put('/admin/edit_subscription/:id',controller.editSubscriptionPlane)
router.post('/admin/create_subscription',controller.createSubscriptionPlane)

//TopUp Plane 
router.post('/admin/create_topup_plane/:id',controller.CreateNewTopUpPlane);

module.exports=router;