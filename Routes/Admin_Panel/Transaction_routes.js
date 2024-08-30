const express=require('express');
const router=new express.Router();
const controller=require('../../controllers/Admin_controller/Transaction_controller');

router.get('/admin/get_transaction/company',controller.GetAllTransaction);

module.exports=router;