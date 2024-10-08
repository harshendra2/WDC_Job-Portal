const { getAllnotificatio, ViewDetails } = require('../controllers/Candidate_Controller/Notification_controller');

//This notification for Candidate if new company is created
const candidateNotification = (io) => {
    io.on("connection", (socket) => {
    socket.on('newCompannynotification',async(userId)=>{
            try {
                const Notification = await getAllnotificatio (userId)
                socket.emit('companynotification', Notification)
            } catch (err) {
                console.log(err)
            }
        
    })

        socket.on('companyviewnotification', async (userId,companyId) => {
            try {
                const Viewed = await ViewDetails(userId,companyId)
                io.emit('companyview', Viewed)
            } catch (err) {
                console.log(err)
            }
        })

        socket.on("disconnect", () => {
            console.log("disconnect")
        })
    })
}

module.exports = candidateNotification
