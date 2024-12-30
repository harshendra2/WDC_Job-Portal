const { getAllMessages, saveNewMessage,GetUserNotification,ViewAllMessage,AdminMessageCount,AdminViewNewMsg} = require('../controllers/Company_Controller/Support_controller');

const chatSocket = (io) => {
  io.on("connection", (socket) => {
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

    socket.on('messageNotification',async(userId)=>{
      try{
         const Notification=await GetUserNotification(userId);
         io.emit('messageNot',Notification);
      }catch(error){
         console.log(error);
      }
    })

    socket.on('ViewNewMessage',async(userId)=>{
      try{
         const ViewMessage=await ViewAllMessage(userId)
      }catch(error){
       console.log(error)
      }
    })

    socket.on('adminMessagNot',async(adminId)=>{
      try{
        const TotalMessage=await AdminMessageCount(adminId)
        io.emit('adminMessageCount',TotalMessage);
      }catch(error){
        console.log(error);
      }
    })

    socket.on('AdminViewNewMessage',async(IssueId)=>{
      try{
      const AdminViewMessage=await AdminViewNewMsg(IssueId);
      }catch(error){
        console.log(error);
      }
    })

    socket.on("disconnect", () => {
      console.log("Client disconnected with ID:", socket.id);
    });
  });
};

module.exports = chatSocket;

