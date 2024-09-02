const express = require("express");
const router = new express.Router();
const controller = require("../../controllers/Admin_controller/adminController");

router.post("/admin/register", controller.adminregister);
router.post("/admin/login", controller.adminLogin);
router.put('/admin/logout/:id',controller.LogOut);
router.post('/admin/forgotpassword',controller.forgotPassword);
router.post('/admin/newpassword',controller.NewPassword);

module.exports=router;