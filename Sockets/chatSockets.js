const { getAllMessages, saveNewMessage } = require('../controllers/Company_Controller/Support_controller');

const chatSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("A client connected with ID:", socket.id);
    socket.on('getAllMessage', async (IssueId) => {
      try {
        const messages = await getAllMessages(IssueId);
        socket.emit('chat', messages);
      } catch (err) {
        socket.emit('error', 'Failed to get messages');
      }
    });

    socket.on('newMessage', async (msg) => {
      try {
        const savedMessage = await saveNewMessage(msg);
        io.emit('message', savedMessage); 
      } catch (err) {
        console.log(err);
        socket.emit('error', 'Failed to save message');
      }
    });
    socket.on("disconnect", () => {
      console.log("Client disconnected with ID:", socket.id);
    });
  });
};

module.exports = chatSocket;

