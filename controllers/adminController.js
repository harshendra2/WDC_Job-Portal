const admin = require("../models/adminSchema");
const bcrypt = require("bcryptjs");
const Joi = require("joi");
const jwt = require("jsonwebtoken")
const SECRET_KEY = process.env.SECRET_KEY;
const nodemailer = require("nodemailer");

const adminRegisterSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

//email config
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user:"harsendraraj20@gmail.com",
    pass:'ukiovyhquvazeomy',
  },
});

exports.adminregister = async (req, res) => {
  const { email, password } = req.body;

  const { error } = adminRegisterSchema.validate({ email, password });
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    const existingAdmin = await admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const newAdmin = new admin({
      email,
      password
    });

    const storeData = await newAdmin.save();
    return res.status(201).json({ message: "Admin Registration Successful" });
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};


exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;

  const { error } = adminRegisterSchema.validate({ email, password });
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    const preAdmin = await admin.findOne({ email });
    if (!preAdmin) {
      return res.status(400).json({ error: "This Email Id is not registered in our Database" });
    }

    const passwordMatch = await bcrypt.compare(password, preAdmin.password);
    if (!passwordMatch) {
      return res.status(400).json({ error: "Invalid password" });
    }

    // Generate token
    const token = await preAdmin.generateAuthtoken();
    return res.status(200).json({ message: "Admin Login Successful", adminToken: token });
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};


exports.sendpasswordlink = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(401).json({ status: 401, message: "Enter your Email" });
  }
  try {
    const adminfind = await admin.findOne({ email: email });

    //token generate for reset password

    const token = jwt.sign({ _id: adminfind._id }, SECRET_KEY, {
      expiresIn: "120s",
    });

    const setadmintoken = await admin.findByIdAndUpdate(
      { _id: adminfind._id },
      { verifytoken: token },
      { new: true }
    );
    if (setadmintoken) {
      const mailOption = {
        from:"harsendraraj20@gmail.com",
        to: email,
        subject: "Sending Email from Password Reset",
        text: `This Link Valid For 2 MINITES http://localhost:4000/api/admin/forgetpassword/${adminfind.id}/${setadmintoken.verifytoken}`,
      };

      transporter.sendMail(mailOption, (error, info) => {
        if (error) {
          console.log("error", error);
          return res.status(404).json({ error: "Email Not Send" });
        } else {
          return res.status(201).json({ message: "Email send Successfully" });
        }
      });
    }
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.forgetpasswordotp = async (req, res) => {
  const { id, token } = req.params;
  try {
    const valideadmin = await admin.findOne({ _id: id, verifytoken: token });

    const verifyToken = jwt.verify(token, SECRET_KEY);

    if (valideadmin && verifyToken._id) {
      return res.status(201).json({ status: 201, valideuser });
    } else {
      return res.status(401).json({ status: 401, message: "admin not exist" });
    }
  } catch (error) {
    return res
      .status(400)
      .json({ error: "Invalid Details", errorMessage: error.message });
  }
};

exports.forgetpasswordtoken = async (req, res) => {
  const { id, token } = req.params;

  const { password } = req.body;
  try {
    const valideadmin = await admin.findOne({ _id: id, verifytoken: token });

    const verifyToken = jwt.verify(token, SECRET_KEY);

    if (valideadmin && verifyToken._id) {
      const newpass = await bcrypt.hash(password, 12);

      const setNewadmin = await admin.findByIdAndUpdate(
        { _id: id },
        { password: newpass }
      );

      setNewadmin.save();
      return res.status(201).json({ status: 201, setNewuser });
    } else {
      return res.status(401).json({ status: 401, message: "user not exist" });
    }
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
