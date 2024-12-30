require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const path=require('path')
require("./db/connection");
const setupCronJobs=require('./Cron');
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
const CredibilityEstablishment=require('./Routes/Company_Panel/Credibility_establishment_route');
const Access_Management=require('./Routes/Company_Panel/Access_management_route')

const CandidateCredentialRoute=require("./Routes/Candidate_Panel/candidate_routes");
const CandidateJobRoute=require("./Routes/Candidate_Panel/Jobs_routes");
const CandidateAppliedJobRoute=require("./Routes/Candidate_Panel/Job_applied");
const CandidteProfile=require('./Routes/Candidate_Panel/Candidate_profile');
const CandidateSupport=require('./Routes/Candidate_Panel/Support_routes');
const CandidateSubscriptionPlane=require('./Routes/Candidate_Panel/Subscription_routes');
const CandidateDashboard=require('./Routes/Candidate_Panel/Dashbord_routes');
const PORT = 4000;


// Middleware
app.use(express.json({ limit: "500mb" })); 
app.use(express.urlencoded({ extended: true, limit: "500mb" }));
setupCronJobs()

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = ["http://localhost:5173", "http://65.20.91.47", "http://65.20.91.47:8001", "http://localhost:5174"];
    if(!origin ||allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Access Restricted: Unauthorized origin."));
    }
  },
};

app.use(cors(corsOptions));
app.use('/Images', express.static(path.join(__dirname, 'Images')));

// const generateRestrictedAccessHTML = () => `
//   <!DOCTYPE html>
//       <html lang="en">
//       <head>
//         <meta charset="UTF-8">
//         <meta name="viewport" content="width=device-width, initial-scale=1.0">
//         <title>Access Restricted</title>
//         <style>
//           body {
//             font-family: 'Arial', sans-serif;
//             background: linear-gradient(135deg, #1a202c, #2d3748);
//             color: #fff;
//             margin: 0;
//             padding: 0;
//             display: flex;
//             justify-content: center;
//             align-items: center;
//             height: 100vh;
//           }
//           .container {
//             text-align: center;
//             padding: 30px;
//             background: rgba(255, 255, 255, 0.1);
//             border: 1px solid rgba(255, 255, 255, 0.2);
//             border-radius: 12px;
//             box-shadow: 0 8px 15px rgba(0, 0, 0, 0.3);
//           }
//           h1 {
//             font-size: 2.5rem;
//             margin-bottom: 15px;
//             color: #ff6f61;
//           }
//           .icon {
//             font-size: 50px;
//             color: #ff6f61;
//             margin-bottom: 15px;
//           }
//           p {
//             font-size: 1rem;
//             margin: 10px 0;
//             color: #d3d3d3;
//           }
//           .button {
//             display: inline-block;
//             margin-top: 20px;
//             padding: 12px 24px;
//             font-size: 1rem;
//             color: #fff;
//             background-color: #ff6f61;
//             text-decoration: none;
//             border-radius: 8px;
//             transition: transform 0.3s ease, background-color 0.3s ease;
//           }
//           .button:hover {
//             background-color: #ff4a3d;
//             transform: scale(1.1);
//           }
//           .secure-notice {
//             margin-top: 20px;
//             font-size: 0.9rem;
//             font-style: italic;
//             color: #e0e0e0;
//           }
//         </style>
//       </head>
//       <body>
//         <div class="container">
//           <div class="icon">🔒</div>
//           <h1>Access Restricted</h1>
//           <p>You do not have permission to access this resource.</p>
//           <p>All unauthorized access attempts are logged and monitored.</p>
//           <a href="/" class="button">Return to Safety</a>
//           <p class="secure-notice">This resource is protected. For further assistance, contact support.</p>
//         </div>
//       </body>
//       </html>
// `;

// app.use((req, res, next) => {
//   const userAgent = req.headers['user-agent'];
//   const Remoteaddress = req.headers['x-forwarded-for'];
//   if (userAgent && (userAgent.includes('Postman') || userAgent.includes('curl'))) {
//     console.log(`Unauthorized access attempt detected from: ${Remoteaddress || req.ip}`);
//     res.status(403).send(generateRestrictedAccessHTML());
//     return;
//   }
//   next();
// });

// const allowedOrigins = ["http://65.20.91.47", "http://65.20.91.47:8001", "http://localhost:5173", "http://localhost:5174", "http://localhost:5172"];

// app.use((req, res, next) => {
//   const referer = req.headers['referer'] || req.headers['origin'];
//   if (!referer || !allowedOrigins.some(origin => referer.startsWith(origin))) {
//     console.log(`Unauthorized referer/origin: ${referer}`);
//     res.status(403).send(generateRestrictedAccessHTML());
//     return;
//   }
//   next();
// });




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
app.use('/api',CredibilityEstablishment);
app.use('/api',Access_Management);
app.use('/api',CandidateCredentialRoute);
app.use('/api',CandidateJobRoute);
app.use('/api',CandidateAppliedJobRoute);
app.use('/api',CandidteProfile);
app.use('/api',CandidateSupport);
app.use('/api',CandidateSubscriptionPlane);
app.use('/api',CandidateDashboard);

const server=app.listen(PORT, () => {
  console.log(`Server Start at port No: ${PORT}`);
});

const io = require("socket.io")(server, {
  cors:'*'
});

chatSocket(io);
companyNotification(io);
candidateNotification(io)
IssueNotification(io);
candidateViewNotification(io);
CandidteIssueNotifcation(io);
AdminNotification(io);


