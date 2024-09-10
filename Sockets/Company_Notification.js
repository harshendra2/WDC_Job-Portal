const { getAllnotificatio, ViewDetails } = require('../controllers/Company_Controller/Notification_controller');

const companyNotification = (io) => {
    io.on("notification", (socket) => {

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
