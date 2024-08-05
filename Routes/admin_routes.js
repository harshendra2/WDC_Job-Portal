const express = require("express");
const router = new express.Router();
const controller = require("../controllers/adminController");

router.post("/admin/register", controller.adminregister);
router.post("/admin/login", controller.adminLogin);
router.post("/admin/sendpasswordlink", controller.sendpasswordlink);
router.get("/admin/forgetpassword/:id/:token", controller.forgetpasswordotp);
router.post("/admin/:id/:token", controller.forgetpasswordtoken);

module.exports=router;