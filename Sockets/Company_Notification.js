const { getAllnotificatio, ViewDetails } = require('../controllers/Company_Controller/Notification_controller');

//This notification for When new Candidate is Created  time comapny get Notification
const companyNotification = (io) => {
    io.on("connection", (socket) => {
        console.log("notification connected")

        const loadNotification = async () => {
            try {
                const Notification = await getAllnotificatio ()
                socket.emit('notification', Notification)
            } catch (err) {
                console.log(err)
            }
        }
        loadNotification()

        socket.on('viewnotification', async (userId) => {
            try {
                const Viewed = await ViewDetails(userId)
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
