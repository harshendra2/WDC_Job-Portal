const { getAllIssueNotificatio,ViewIssues} = require('../controllers/Candidate_Controller/Notification_controller');
//this notification for Candidate when issue Solved
const IssueNotification = (io) => {
    io.on("connection", (socket) => {
        console.log("Issue notification socket connected")

        socket.on('issuenotification',async(userId)=>{
            try{
                const Notification = await getAllIssueNotificatio (userId)
                socket.emit('notification', Notification)
            }catch(error){
                console.log(error);
            }
        })

 socket.on('viewissuenotification', async (userId) => {
            try {
                const Viewed = await ViewIssues(userId)
            } catch (err) {
                console.log(err)
            }
        })

        socket.on("disconnect", () => {
            console.log("disconnect")
        })
    })
}

module.exports = IssueNotification
