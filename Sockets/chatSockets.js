const { getAllMessages, saveNewMessage } = require('../controllers/Company_Controller/Support_controller')

const chatSocket = (io) => {
    io.on("connection", (socket) => {
        console.log("connected")

        const loadMessages = async () => {
            try {
                const messages = await getAllMessages()
                socket.emit('chat', messages)
            } catch (err) {
                console.log(err)
            }
        }
        loadMessages()

        socket.on('newMessage', async (msg) => {
            try {
                const savedMessage = await saveNewMessage(msg)
                io.emit('message', savedMessage)
            } catch (err) {
                console.log(err)
            }
        })

        socket.on("disconnect", () => {
            console.log("disconnect")
        })
    })
}

module.exports = chatSocket
