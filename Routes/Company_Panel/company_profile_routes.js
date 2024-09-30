const express=require('express');
const router=new express.Router();
const controller=require("../../controllers/Company_Controller/Company_profile_Controller");
const {upload}=require("../../middleware/multiple_image_multer");


router.get('/company/profile/:id',controller.GetCompanyProfile);
router.get('/company/get/saved/data/:id',controller.GetSavedProfileData);
router.put('/company/edit/profile/:id', upload.fields([{ name: 'panImage' },{ name: 'gstImage' },{name:"profile"}]),controller.EditProfile);

// verify Gst number 
router.put('/company/gst_verify/:id',controller.ComapnyGSTerify);
router.put('/company/pan_verify/:id',controller.CompanyPANVerify);
module.exports=router;