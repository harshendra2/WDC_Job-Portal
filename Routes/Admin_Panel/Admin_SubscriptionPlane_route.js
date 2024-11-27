const express=require('express');
const router=new express.Router();
const controller=require('../../controllers/Admin_controller/Admin_Subscription_Controller');

//Subscription Plane
router.get('/admin/get_subscription',controller.getallsubscription);
router.get('/admin/get_subscription_name',controller.getAllSubscriptionName);
router.get('/admin/get_singlesubscription/:id',controller.getSingleSubscription);
router.put('/admin/edit_subscription/:id',controller.editSubscriptionPlane);
router.post('/admin/create_subscription',controller.createSubscriptionPlane);

//TopUp Plane 
router.post('/admin/create_topup_plane',controller.CreateNewTopUpPlane);
router.put('/admin/edit_topUP/:id',controller.EditTopUpPlane);
router.get('/admin/get_Topup_name',controller.GetAllTopUpplaneName);
router.get('/admin/get_singletopupplane/:id',controller.getSingleTopUpPlane);

//Candidate Subscription Plane
router.get('/admin/candidate/subscription',controller.GetAllCandidateSubscriptionPlane);
router.post('/admin/create/candidateSub',controller.CreateCandidateSubscription);
router.get('/admin/candidate_subscriptionname/:id',controller.GetCandidateSubscriptionName);
router.get('/admin/get_singlesub/:id',controller.GetSingleCandidateSubscription);
router.put('/admin/edit_candidate/subscription/:id',controller.EditCandidateSubscription);


//Green batch subscription plane 
router.get('/admin/get_green_batch/subscription',controller.GetAllGreenBatchSubscription);
router.get('/admin/get_single/green_batch/:id',controller.GetSingleGreenBatch);
router.put('/admin/Edit_green/batch/:id',controller.EditGreenBatch)
router.post('/admin/add_new/green_batch',controller.AddNewGreenBatch);

//Promote subscription plan
router.get('/admin/get_promote/subscription',controller.GetAllPromoteSubscription);
router.get('/admin/get_single/promote_sub/:id',controller.GetSinglePromoteSubscription);
router.put('/admin/Edit_promot/sub/:id',controller.EditPromoteSub)
router.post('/admin/add_new/promote',controller.AddNewPromotePlan);



module.exports=router;