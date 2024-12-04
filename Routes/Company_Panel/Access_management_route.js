const express = require("express");
const router = new express.Router();
const Controller=require('../../controllers/Company_Controller/Accessmanagement_Controller');

router.get('/company/get/subadmin/:cmpId',Controller.GetAllSubAdmin);
router.get('/company/get/single_access/:cmpId/:email',Controller.GetSingleHrAccessDetails);
router.post('/company/add_hr/:cmpId',Controller.AddNewHrData);
router.put('/company/edit_hr/responsibility/:cmpId/:email',Controller.EditHrResponsibility);
router.delete('/company/delete_hr/:cmpId/:email',Controller.DeleteExistedHRData);

module.exports=router;