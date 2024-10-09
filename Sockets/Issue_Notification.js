const { getAllIssueNotificatio,ViewIssues} = require('../controllers/Company_Controller/Notification_controller');

const IssueNotification = (io) => {
    io.on("connection", (socket) => {
        console.log("Issue notification socket connected");
        socket.on('issuenotification', async (companyId) => {
            try {
                socket.join(companyId);

                const Notification = await getAllIssueNotificatio(companyId);
                
                io.to(companyId).emit('notification', Notification);
            } catch (error) {
                console.log(error);
            }
        });

        socket.on('viewissuenotification', async (companyId) => {
            try {
                const viewed = await ViewIssues(companyId);
            } catch (err) {
                console.log(err);
            }
        });

        socket.on("disconnect", () => {
            console.log("User disconnected");
        });
    });
};

module.exports = IssueNotification;

