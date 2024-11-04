const express = require("express");
const router = new express.Router();
const controller=require('../../controllers/Admin_controller/Privacy_policy_controller');
const {upload}=require("../../middleware/Privacy_multer")

router.post('/admin/privacy/policy',upload.single("file"),controller.AddCompanyPrivacyPolicy);
router.post('/admin/terms/file',upload.single('file'),controller.AddNewTermsFiles);

module.exports=router;