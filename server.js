require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const path=require('path')
require("./db/connection");
// Import cron job
require('./SubscriptionExpire/subscriptionExpiry');
//import Sockets Files
const chatSocket = require('./Sockets/chatSockets');
const companyNotification=require('./Sockets/Company_Notification');
const candidateNotification=require('./Sockets/Candidate_Notification');
const IssueNotification=require('./Sockets/Issue_Notification');
const candidateViewNotification=require('./Sockets/CandidateView_CV_Notification');
const CandidteIssueNotifcation=require('./Sockets/Candidate_Issue_Notification');
const AdminNotification=require('./Sockets/Admin_Notification');


const router = require("./Routes/Admin_Panel/admin_routes");
const companyRoute=require("./Routes/Admin_Panel/Onboard_Company_routes");
const candidateRoute=require("./Routes/Admin_Panel/Onboard_Candidate_routes");
const adminSubscriptionRoute=require("./Routes/Admin_Panel/Admin_SubscriptionPlane_route");
const adminAccessManagementRoute=require("./Routes/Admin_Panel/Access_Management");
const adminUserVerification=require("./Routes/Admin_Panel/User_verification_routes");
const adminSupportRoute=require("./Routes/Admin_Panel/Support_routes");
const JobListingRoute=require("./Routes/Admin_Panel/Job_listing_routes");
const adminDashboard=require("./Routes/Admin_Panel/Admin_Dashboard");
const AdminTransaction=require('./Routes/Admin_Panel/Transaction_routes');
const credibilityEstablisment=require('./Routes/Admin_Panel/Credibility_Establishment');
const privacyPolicy=require('./Routes/Admin_Panel/Privacy_policy');

const CompanyCredentialRoute=require("./Routes/Company_Panel/company_routes")
const companysubscriptionRoute=require("./Routes/Company_Panel/subscription_plane_routes")
const companyDashboardRoute=require("./Routes/Company_Panel/company_dashboard_route");
const companyCreateJobRoute=require("./Routes/Company_Panel/Create_Job_routes");
const companySupportRoute=require("./Routes/Company_Panel/Support_routes");
const companyProfile=require("./Routes/Company_Panel/company_profile_routes");
const companyHireCandidate=require("./Routes/Company_Panel/Hire_candidate_routes");
const SideBarRoute=require('./Routes/Company_Panel/SideBare_routes');
const CompanyTransaction=require('./Routes/Company_Panel/Transaction_routes');
const BackgroundVerification=require('./Routes/Company_Panel/Background_Verification_route');

const CandidateCredentialRoute=require("./Routes/Candidate_Panel/candidate_routes");
const CandidateJobRoute=require("./Routes/Candidate_Panel/Jobs_routes");
const CandidateAppliedJobRoute=require("./Routes/Candidate_Panel/Job_applied");
const CandidteProfile=require('./Routes/Candidate_Panel/Candidate_profile');
const CandidateSupport=require('./Routes/Candidate_Panel/Support_routes');
const CandidateSubscriptionPlane=require('./Routes/Candidate_Panel/Subscription_routes');
const PORT = 4000;


// Middleware
app.use(express.json({ limit: "500mb" })); 
app.use(express.urlencoded({ extended: true, limit: "500mb" }));
app.use(cors());
app.use('/api',router);
app.use('/api',companyRoute);
app.use('/api',candidateRoute);
app.use('/api',adminSubscriptionRoute);
app.use('/api',adminAccessManagementRoute);
app.use('/api',adminUserVerification);
app.use('/api',adminSupportRoute);
app.use('/api',JobListingRoute);
app.use('/api',adminDashboard);
app.use('/api',AdminTransaction);
app.use('/api',credibilityEstablisment);
app.use('/api',privacyPolicy);
app.use('/api',CompanyCredentialRoute);
app.use('/api',companysubscriptionRoute);
app.use('/api',companyDashboardRoute);
app.use('/api',companyCreateJobRoute);
app.use('/api',companySupportRoute);
app.use('/api',companyProfile);
app.use('/api',companyHireCandidate);
app.use('/api',SideBarRoute);
app.use('/api',CompanyTransaction);
app.use('/api',BackgroundVerification);
app.use('/api',CandidateCredentialRoute);
app.use('/api',CandidateJobRoute);
app.use('/api',CandidateAppliedJobRoute);
app.use('/api',CandidteProfile);
app.use('/api',CandidateSupport);
app.use('/api',CandidateSubscriptionPlane);

app.use('/Images', express.static(path.join(__dirname, 'Images')));
const server=app.listen(PORT, () => {
  console.log(`Server Start at port No: ${PORT}`);
});

const io = require("socket.io")(server, {
  cors: {
    origin: '*'
  }
});

chatSocket(io);
companyNotification(io);
candidateNotification(io)
IssueNotification(io);
candidateViewNotification(io);
CandidteIssueNotifcation(io);
AdminNotification(io);


