const express=require('express');
const router=new express.Router();
const controller=require("../../controllers/Company_Controller/Transaction_Controller");

router.get('/company/get_transaction/company',controller.GetAllTransaction);

module.exports=router;