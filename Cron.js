const axios = require('axios');
const cron = require('node-cron');
const controller=require('./controllers/Candidate_Controller/Cridential_controller')

const callApi = async () => {
  try {
   controller.GetAllDataFromZohoReport()
  } catch (error) {
    console.error("Error calling API:", error.response?.data || error.message);
  }
};


const setupCronJobs =async () => {
    cron.schedule('0 0 * * *',() => {
        console.log("Running cron job to call API...");
        callApi();
    });
};

module.exports = setupCronJobs;