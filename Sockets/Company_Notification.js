const { getAllnotificatio, ViewDetails } = require('../controllers/Company_Controller/Notification_controller');

const companyNotification = (io) => {
    io.on("connection", (socket) => {
        socket.on('newCandidatenotification',async(companyId)=>{
            try {
                socket.join(companyId);
                const Notification = await getAllnotificatio (companyId)
                io.to(companyId).emit('candidatenotification', Notification)
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

module.exports = companyNotification;