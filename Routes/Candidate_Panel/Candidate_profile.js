const express=require('express');
const router=new express.Router();
const {upload}=require("../../middleware/multer")
const controller=require('../../controllers/Candidate_Controller/profile_controller');

router.get('/candidate/profile/:id',controller.getProfilePercentageStatus);
//add some work experience
 router.put('/candidate/profile/experience/:id',controller.AddSomeWorkexperience);
 router.get('/candidate/profile/get_single/exp/:user_id/:exp_id',controller.getSingleWorkExp);
 router.put('/candidate/profile/edit_exp/:user_id/:exp_id',controller.EditExp);

 //edit Basic details 
 router.get('/candidate/profile/get_basic/:user_id',controller.GetBasicDetails);
 router.put('/candidate/profile/edit_basic/:user_id',controller.EditBasicDetails);

 //Edit personal details
 router.get('/candidate/profile/get_personal/:user_id',controller.GetPersonlDetails);
 router.put('/candidate/profile/edit_personal/:user_id',controller.EditPersonalDetails);

 //Edit work details
 router.get('/candidate/profile/get_work/:user_id',controller.GetworkDetails);
 router.put('/candidate/profile/edit_work/:user_id',upload.single("file"),controller.EditWorkDetails);

 //Edit Education details
 router.get('/candidate/profile/get_education/:user_id',controller.GetEducationDetails);
 router.put('/candidate/profile/add_education/:user_id',controller.AddNewAducation);


module.exports=router;