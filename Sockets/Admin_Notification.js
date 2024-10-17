const {NewCompanyCreated,ViewCompanyNotification,NewCandidateCreated,ViewCandidateNotification} = require('../controllers/Admin_controller/AdminNotification_Controller');

//This notification for Candidate if new company is created
const AdminNotification = (io) => {
    io.on("connection", (socket) => {

        //Admin get notification when New company is Created
    socket.on('CompanyCreatedNotification',async(adminId)=>{
            try {
                const Notification = await NewCompanyCreated (adminId)
                socket.emit('AdminNewComanynotification', Notification)
            } catch (err) {
                console.log(err)
            }
        
    })

        socket.on('adminviewnotification', async (adminId,companyId) => {
            try {
                const Viewed = await ViewCompanyNotification(adminId,companyId)
                io.emit('AdminView', Viewed)
            } catch (err) {
                console.log(err)
            }
        })

        //Admin get Notification when new Candidate Created

        socket.on('CandidateCreatedNotification',async(adminId)=>{
            try {
                const Notification = await NewCandidateCreated (adminId)
                socket.emit('AdminNewCandidateNotification', Notification)
            } catch (err) {
                console.log(err)
            }
        
    })

        socket.on('adminviewCandidateNotification', async (adminId,candidateId) => {
            try {
                const Viewed = await ViewCandidateNotification(adminId,candidateId)
                io.emit('AdminView', Viewed)
            } catch (err) {
                console.log(err)
            }
        })


        socket.on("disconnect", () => {
            console.log("disconnect")
        })
    })
}

module.exports = AdminNotification
