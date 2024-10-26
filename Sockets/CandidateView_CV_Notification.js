const {GetAllCVviewedCompany,CandidateViewedCompany} = require('../controllers/Candidate_Controller/Notification_controller');

//This notification for Candidate if new company is created
const candidateNotification = (io) => {
    io.on("connection", (socket) => {
    socket.on('getcvviewnotification',async(userId)=>{
            try {
                const Notification = await GetAllCVviewedCompany (userId)
                socket.emit('companyViewnotification', Notification)
            } catch (error) {
                console.log(error)
            }
        
    })

        socket.on('companyviewnotification', async (userId,companyId) => {
            try {
                const Viewed = await CandidateViewedCompany(userId,companyId)
                io.emit('companyview', Viewed)
            } catch (error) {
                console.log(error)
            }
        })

        socket.on("disconnect", () => {
            console.log("disconnect")
        })
    })
}

module.exports = candidateNotification
