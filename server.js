require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
require("./db/connection");
const router = require("./Routes/admin_routes");
const companyRoute=require("./Routes/Onboard_Company_routes");
const candidateRoute=require("./Routes/Onboard_Candidate_routes");
const adminSubscriptionRoute=require("./Routes/Admin_SubscriptionPlane_route");
const CompanyCredentialRoute=require("./Routes/Company_Panel/company_routes")
const PORT = 4000;


// Middleware
app.use(express.json({ limit: "500mb" })); // Parse JSON bodies with increased limit
app.use(express.urlencoded({ extended: true, limit: "500mb" })); // Parse URL-encoded bodies with increased limit
app.use(cors());
app.use('/api',router);
app.use('/api',companyRoute);
app.use('/api',candidateRoute);
app.use('/api',adminSubscriptionRoute);
app.use('/api',CompanyCredentialRoute);

app.listen(PORT, () => {
  console.log(`Server Start at port No: ${PORT}`);
});
