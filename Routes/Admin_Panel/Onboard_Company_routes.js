const express = require("express");
const router = new express.Router();
const controller = require("../../controllers/Admin_controller/Onboard_CompanyController");
const {upload}=require('../../middleware/multiple_image_multer')

router.post('/admin/create_company',upload.fields([{ name: 'panImage' },{ name: 'gstImage' }]),controller.createOnboardCompany);
router.get('/admin/get_company',controller.getAllOnboardCompany);
router.get('/admin/get_single_company/:id', controller.getSingleCompany);
router.put('/admin/edit_company/:id', controller.editOnboardCompany);

module.exports = router;
