const express=require('express');
const router=new express.Router();
const controller=require('../../controllers/Admin_controller/Transaction_controller');

router.get('/admin/get_transaction/company/:page/:limit',controller.GetAllTransaction);
router.post('/admin/get_transaction/company/search',controller.SearchCompanyTransacation);
router.get('/admin/get_transaction/candidate/:page/:limit',controller.GetAllCandidateTransation);
router.post('/admin/get_transaction/candidate/search',controller.SearchCandidateTransaction);

module.exports=router;