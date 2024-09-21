const mongoose = require('mongoose');
const CompanyTransactionSchema = new mongoose.Schema({
    company_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
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
      type:Number
    },
    purchesed_data:{
        type:Date
    },
    Expire_date:{
        type:Date
    }

});

module.exports = mongoose.model('CompanyTransaction', CompanyTransactionSchema);
