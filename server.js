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
const companysubscriptionRoute=require("./Routes/Company_Panel/subscription_plane_routes")
const companyDashboardRoute=require("./Routes/Company_Panel/company_dashboard_route");
const companyCreateJobRoute=require("./Routes/Company_Panel/Create_Job_routes");
const companySupportRoute=require("./Routes/Company_Panel/Support_routes");
const CandidateCredentialRoute=require("./Routes/Candidate_Panel/candidate_routes");
const CandidateJobRoute=require("./Routes/Candidate_Panel/Jobs_routes");
const CandidateAppliedJobRoute=require("./Routes/Candidate_Panel/Job_applied");
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
app.use('/api',companysubscriptionRoute);
app.use('/api',companyDashboardRoute);
app.use('/api',companyCreateJobRoute);
app.use('/api',companySupportRoute);
app.use('/api',CandidateCredentialRoute);
app.use('/api',CandidateJobRoute);
app.use('/api',CandidateAppliedJobRoute);

app.listen(PORT, () => {
  console.log(`Server Start at port No: ${PORT}`);
});
