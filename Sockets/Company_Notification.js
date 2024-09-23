const { getAllnotificatio, ViewDetails } = require('../controllers/Company_Controller/Notification_controller');

//This notification for When new Candidate is Created  time comapny get Notification
const companyNotification = (io) => {
    io.on("connection", (socket) => {
        console.log("notification connected")

        socket.on('newCandidatenotification',async(companyId)=>{
            try {
                const Notification = await getAllnotificatio (companyId)
                socket.emit('notification', Notification)
            } catch (err) {
                console.log(err)
            }
        
    })
        socket.on('viewnotification', async (companyId,userId) => {
            try {
                const Viewed = await ViewDetails(companyId,userId)
                io.emit('view', Viewed)
            } catch (err) {
                console.log(err)
            }
        })

        socket.on("disconnect", () => {
            console.log("disconnect")
        })
    })
}

module.exports = companyNotification
