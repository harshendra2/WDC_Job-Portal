const mongoose = require('mongoose');
const CandidateTransactionSchema = new mongoose.Schema({
    candidate_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'candidate',
        required: true
    },
    type:{
        type:String
    },
    Plane_name:{
      type:String
    },
    price: {
        type: Number,
        required: true
    },
    payment_method: {
        type: String, 
        required: true
    },
    transaction_Id: {
      type:String
    },
    purchesed_data:{
        type:Date
    },
    Expire_date:{
        type:Date
    }

});

module.exports = mongoose.model('CandidateTransaction', CandidateTransactionSchema);
