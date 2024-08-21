const express=require('express');
const router=new express.Router();
const controller=require("../../controllers/Company_Controller/Company_profile_Controller");
const {upload}=require("../../middleware/multiple_image_multer");

router.get('/company/profile/:id',controller.GetCompanyProfile);
router.put('/company/edit/profile/:id',upload.fields([{ name: 'panImage', maxCount: 1 },{ name: 'gstImage', maxCount: 1 }]),controller.EditProfile);

module.exports=router;