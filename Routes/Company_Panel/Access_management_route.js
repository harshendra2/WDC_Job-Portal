const express = require("express");
const router = new express.Router();
const Controller=require('../../controllers/Company_Controller/Accessmanagement_Controller');

router.get('/company/get/subadmin',Controller.GetAllSubAdmin);

module.exports=router;