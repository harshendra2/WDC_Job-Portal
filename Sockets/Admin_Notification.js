const {NewCompanyCreated,ViewCompanyNotification,NewCandidateCreated,ViewCandidateNotification,GetSupportRequestNot,ViewSupportNotification,KYCVerificationRequest,ViewKYCreqyest} = require('../controllers/Admin_controller/AdminNotification_Controller');

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
                io.emit('AdminViews', Viewed)
            } catch (err) {
                console.log(err)
            }
        })

    //SubAdmin LogedIn Notification
          socket.on('SubadminloginNot',async(superAdminId)=>{
            try{
                const GetNotification=await GetSubAdminLogInNot(superAdminId);
              socket.emit('getsubadminNot',GetNotification)
            }catch(error){
                console.log(error);
            }
          })

    //Support Notification 
      socket.on('SupportAdminNotification',async()=>{
        try{
            const GetSupportNTF=await GetSupportRequestNot();
            socket.emit('listsupportrequest',GetSupportNTF);
        }catch(error){
            console.log(error);
        }
      })

      socket.on('adminviewSupport', async (supportId) => {
        try {
            const Viewed = await ViewSupportNotification(supportId);
            io.emit('AdminViewsupport', Viewed)
        } catch (err) {
            console.log(err)
        }
    })

    //Company KYC verififcation request 
     socket.on('kycverificationrequest',async()=>{
        try{
               const data=await KYCVerificationRequest();
               io.emit('listkycrequest',data);
        }catch(error){
            console.log(error);
        }
     })

     socket.on('viewKYCRequest',async(cmpID)=>{
        try{
            const data=await ViewKYCreqyest(cmpID)
        }catch(error){
            console.log(error);
        }
     })

        socket.on("disconnect", () => {
            console.log("disconnect")
        })
    })
}

module.exports = AdminNotification
