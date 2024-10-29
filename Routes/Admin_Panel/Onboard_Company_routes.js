const express = require("express");
const router = new express.Router();
const controller = require("../../controllers/Admin_controller/Onboard_CompanyController");
const {upload}=require('../../middleware/multiple_image_multer');
const {uploadss}=require('../../middleware/ExcelFiles');

router.post('/admin/create_company',upload.fields([{ name: 'panImage' },{ name: 'gstImage' },{name:'profile'}]),controller.createOnboardCompany);
router.get('/admin/get_company',controller.getAllOnboardCompany);
router.get('/admin/get_single_company/:id', controller.getSingleCompany);
router.put('/admin/edit_company/:id',upload.fields([{ name: 'panImage' },{ name: 'gstImage' },{name:'profile'}]),controller.editOnboardCompany);

// download Excel and upload Excel Sheets
router.get('/admin/company/download-excel-template',controller.DownloadExcelTemplete);
router.post('/admin/company/upload-excel', uploadss.single('file'),controller.uploadExcelFile);
router.post('/admin/company/send_email',controller.SendEmailImportedCandidate);

module.exports = router;