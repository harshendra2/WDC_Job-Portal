const { getAllnotificatio, ViewDetails } = require('../controllers/Candidate_Controller/Notification_controller');

const candidateNotification = (io) => {
    io.on("connection", (socket) => {
        console.log("candidate notification is connected")

        const loadNotification = async () => {
            try {
                const Notification = await getAllnotificatio ()
                socket.emit('companynotification', Notification)
            } catch (err) {
                console.log(err)
            }
        }
        loadNotification()

        socket.on('companyviewnotification', async (userId) => {
            try {
                const Viewed = await ViewDetails(userId)
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