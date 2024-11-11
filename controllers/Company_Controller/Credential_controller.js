const Joi = require("joi");
const twilio = require("twilio");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendEmail,sendMailToReg} = require('../../Service/sendMail');
const { generateOTP } = require('../../Service/generateOTP');
const nodemailer = require("nodemailer");
const { email } = require("../../config/emailConfig");
const company = require("../../models/Onboard_Company_Schema");
const CompanySubscription = require("../../models/Company_SubscriptionSchema");
const basic_details = require("../../models/Basic_details_CandidateSchema");
const candidate = require('../../models/Onboard_Candidate_Schema')
const TarmsPrivacy = require('../../models/Terms_PrivarySchema');

const companyRegistration = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  setpassword: Joi.string()
    .min(6)
    .required()
    .valid(Joi.ref("password"))
    .messages({ "any.only": "Password and set password do not match" }),
});

const OnboardRegistration = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  setpassword: Joi.string()
    .min(6)
    .required()
    .valid(Joi.ref("password"))
    .messages({ "any.only": "Password and set password do not match" }),
  company_name: Joi.string().min(3).required()
});

const ForgotPasswordValidation = Joi.object({
  email: Joi.string().email().required(),
});

const companylogin = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const forgotPasswordConfirmation = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  confirmpassword: Joi.string()
    .min(6)
    .required()
    .valid(Joi.ref("password"))
    .messages({ "any.only": "Password and confirm password do not match" }),
});

const accountSid = process.env.ACCOUNTSID;
const authToken = process.env.AUTHTOKEN;

const client = new twilio(accountSid, authToken);

//email config
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: email.user,
    pass: email.pass,
  },
});

exports.CompanyRegistration = async (req, res) => {
  const { email, password, setpassword } = req.body;
  const { error } = companyRegistration.validate({
    email,
    password,
    setpassword,
  });

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  try {
    const alreadyexisted = await company.findOne({ email: email });
    if (alreadyexisted) {
      return res.status(400).json({ error: "This email already exists" });
    }
    const existedCandidate = await basic_details.findOne({ email: email });
    if (existedCandidate) {
      return res.status(400).json({ error: "This email is already associated with an existing Candidate." })
    }
    const data = { email, password };
    return res.status(200).json({ message: "registration successfully", data });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getOTP = async (req, res) => {
  const { email } = req.body;

  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const OTP = generateOTP();

  try {
    let Message=await sendMailToReg(email, OTP);

    
      return res
        .status(200)
        .json({ message: "OTP has been sent successfully. Please check your email.", OTP });
    
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.Registration = async (req, res) => {
  const { email, password, company_name, setpassword } =
    req.body;
  const { error } = OnboardRegistration.validate({
    email,
    password,
    setpassword,
    company_name
  });

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 12);

    const existsEmail = await company.findOne({ email });
    if (existsEmail) {
      return res
        .status(400)
        .json({ error: "This email already exists in our database" });
    }

    const companydata = new company({
      email,
      password: hashedPassword,
      company_name
    });
    const data = await companydata.save();

    if (data) {
      return res.status(200).json({ message: "Registration Successfully" });
    }
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};


exports.Login = async (req, res) => {
  const { email, password } = req.body;

  const { error } = companylogin.validate({ email, password });
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  try {
    const [existedCompany, existUser] = await Promise.all([
      company.findOne({ email }).lean(),
      basic_details.findOne({ email }).lean()
    ]);

    if (existedCompany) {
      const subscriptionExists = await CompanySubscription.findOne({
        company_id: existedCompany._id,
        expiresAt: { $gte: Date.now() },
        $or: [{ user_access: { $gt: 0 } }, { user_access: 'Unlimited' }]
      }).lean();
      if (subscriptionExists) {
        const passwordMatch = await bcrypt.compare(
          password,
          existedCompany.password
        );
        if (!passwordMatch) {
          return res.status(400).json({ error: 'Invalid password' });
        }

        const OTP = generateOTP();

        // If subscription exists, send OTP
        if (subscriptionExists) {
          await sendEmail(email, OTP);
          return res.status(200).json({
            message: 'OTP sent successfully',
            companyOTP: OTP
          });
        }
      }

      if (existedCompany.company_access_count > 0) {
        const passwordMatch = await bcrypt.compare(
          password,
          existedCompany.password
        );
        if (!passwordMatch) {
          return res.status(400).json({ error: 'Invalid password' });
        }
        const OTP = generateOTP();

        await sendEmail(email, OTP);
        return res.status(200).json({
          message: 'OTP sent successfully',
          companyOTP: OTP
        });
      }

      return res
        .status(400)
        .json({ error: 'No login access available for this company' });
    }

    if (existUser) {
      const passwordMatch = await bcrypt.compare(
        password,
        existUser.password
      );
      if (!passwordMatch) {
        return res.status(400).json({ error: 'Invalid password' });
      }

      const candiateID = await candidate.findOne({
        basic_details: existUser._id
      });

      const token = jwt.sign(
        { _id: candiateID._id },
        process.env.CANDIDATESECRET_KEY,
        { expiresIn: '30d' }
      );
      return res.status(200).json({
        message: 'User Login Successfully',
        CandidateToken: token
      });
    }

    return res
      .status(400)
      .json({ error: 'This Email ID does not exist in our Database' });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.CompanyOTP = async (req, res) => {
  const { email } = req.body;
  try {
    const existedCompany = await company.findOne({ email }).lean();

    if (!existedCompany) {
      return res.status(400).json({ error: "Company not found" });
    }

    const subscriptionExists = await CompanySubscription.findOne({
      company_id: existedCompany._id,
      expiresAt: { $gte: Date.now() },
      $or: [
        { user_access: { $gt: 0 } },
        { user_access: "Unlimited" }
      ]
    }).lean();

    if (typeof subscriptionExists?.user_access == 'number') {
      // Update user_access_Login_count and Logged_In_count
      await CompanySubscription.updateOne(
        { _id: subscriptionExists._id },
        { $inc: { user_access: -1 } }
      );

      await company.updateOne(
        { _id: existedCompany._id },
        { $inc: { Logged_In_count: 1 } }
      );

      // Generate JWT token for the company
      const token = jwt.sign(
        { _id: existedCompany._id },
        process.env.COMPANYSECRET_KEY,
        { expiresIn: "30d" }
      );

      return res.status(200).json({ message: "Company login successfully", companyToken: token });
    } else if (typeof subscriptionExists?.user_access == 'string') {
      await company.updateOne(
        { _id: existedCompany._id },
        { $inc: { Logged_In_count: 1 } }
      );

      // Generate JWT token for the company
      const token = jwt.sign(
        { _id: existedCompany._id, email: existedCompany.email },
        process.env.COMPANYSECRET_KEY,
        { expiresIn: "30d" }
      );

      return res.status(200).json({ message: "Company login successfully", companyToken: token });
    }

    if (existedCompany.company_access_count > 0) {
      // Update company_access_count and Logged_In_count
      await company.updateOne(
        { _id: existedCompany._id },
        { $inc: { company_access_count: -1, Logged_In_count: 1 } }
      );

      // Generate JWT token for the company
      const token = jwt.sign(
        { _id: existedCompany._id, email: existedCompany.email },
        process.env.COMPANYSECRET_KEY,
        { expiresIn: "30d" }
      );

      return res.status(200).json({ message: "Company login successfully", companyToken: token });
    }

    return res.status(400).json({ error: "No login access available for this company" });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};


exports.GetCompanyDetails = async (req, res) => {
  const { cmpId } = req.params
  try {
    if (!cmpId) {
      return res.status(400).json({ error: "Please provide Company Id" });
    }

    const data = await company.findById(cmpId).select('profile company_name verified_batch');
    return res.status(200).send(data);

  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

exports.GetCandidateDetails = async (req, res) => {
  const { userId } = req.params;
  try {
    if (!userId) {
      return res.status(400).json({ error: "Please provide User ID" })
    }
    const candidateDetails = await candidate
      .findById(userId)
      .populate({
        path: 'basic_details',
        select: 'name',
      })
      .select('profile');

    return res.status(200).send(candidateDetails);

  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}


exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  const { error } = ForgotPasswordValidation.validate({ email });
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    const [existedCompany, existedUser] = await Promise.all([
      company.findOne({ email }).lean(),
      basic_details.findOne({ email }).lean()
    ]);

    if (existedCompany || existedUser) {
      const OTP = generateOTP();

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Password Reset OTP",
        html: `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <div style="max-width: 600px; margin: auto; padding: 20px; background-color: #f7f8fa; border-radius: 8px; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
        <h2 style="text-align: center; color: #1a73e8;">Password Reset OTP</h2>
        <p style="font-size: 16px; color: #333;">
          Hello,
        </p>
        <p style="font-size: 16px; color: #333;">
          You requested an OTP to reset your password. Please use the code below to proceed with resetting your password:
        </p>
        
        <div style="text-align: center; background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="font-size: 24px; color: #333; margin: 0;"><strong>${OTP}</strong></p>
        </div>
        
        <p style="font-size: 16px; color: #333;">
          This OTP is valid for <strong>10 minutes</strong>. If you did not request this, please ignore this email to keep your account secure.
        </p>
        
        <p style="font-size: 16px; color: #1a73e8; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
          Thank you,<br>
          <strong>The Support Team</strong>
        </p>
      </div>
    </div>
  `,
      };

      await transporter.sendMail(mailOptions);

      return res.status(200).json({ message: "Email sent successfully. Please check your inbox for OTP.", OTP, email });
    }

    return res.status(404).json({ error: "This email ID does not exist in our database." });

  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};


exports.NewPassowrd = async (req, res) => {
  const { email, password, confirmpassword } = req.body;

  const { error } = forgotPasswordConfirmation.validate({
    email,
    password,
    confirmpassword,
  });
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    const [existedCompany, existedUser] = await Promise.all([
      company.findOne({ email }),
      basic_details.findOne({ email })
    ]);
    if (!existedCompany && !existedUser) {
      return res.status(404).json({ status: 404, message: "Company or User does not exist" });
    }

    const newPass = await bcrypt.hash(password, 12);
    if (existedCompany) {
      existedCompany.password = newPass;
      await existedCompany.save();

      return res.status(201).json({ status: 200, message: "Password updated successfully" });
    }

    if (existedUser) {
      existedUser.password = newPass;
      await existedUser.save();

      return res.status(201).json({ status: 200, message: "Password updated successfully" });
    }
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};



exports.CompanyLogOut = async (req, res) => {
  const { company_id } = req.body;
  try {
    const companys = await company.findById(company_id);
    if (!companys) {
      return res.status(404).json({ error: 'Company not found' });
    }

    if (companys.company_access_count < 1) {
      const existedCompany = await company.findOneAndUpdate(
        { email: companys?.email },
        { $inc: { company_access_count: 1, Logged_In_count: -1 } }
      );

      if (existedCompany) {
        return res.status(200).json({ message: 'Company logged out successfully' });
      } else {
        return res.status(400).json({ error: 'Something went wrong' });
      }
    } else {
      await company.findOneAndUpdate(
        { email: companys?.email },
        { $inc: { Logged_In_count: -1 } }
      );

      const updatedSubscription = await CompanySubscription.findOneAndUpdate(
        {
          company_id: companys._id,
          expiresAt: { $gte: Date.now() }
        },
        { $inc: { user_access: 1 } }
      );

      if (updatedSubscription) {
        return res.status(200).json({ message: 'Company logged out successfully' });
      } else {
        return res.status(200).json({
         message: 'Company logged out successfully'
        });
      }
    }
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};


exports.GetTermsAndPrivacy = async (req, res) => {
  try {
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const data = await TarmsPrivacy.findOne();
    let TermsImage = {
      TermsImage: `${baseUrl}/${data?.terms_image.replace(/\\/g, "/")}`,
      privacy_image: `${baseUrl}/${data?.privacy_image.replace(/\\/g, "/")}`,
    }

    return res.status(200).send(TermsImage);

  } catch (error) {
    return res.status(500).json({ error: "Intarnal server error" });
  }
}