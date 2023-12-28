const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    mobile: {
        type: Number,
        required: true,
      },
    password:{
        type:String,
        required:true
    },
    
    token:{
        type: String,
        default:0
    },
    referralCode:{
        type: String,
        default:0

    },
    usedReferralCode:{
        type: String,
        default:0

    },

    is_verified:{
        type:Number,
        default:0
    },
    is_admin:{
        type: Boolean,
        default: false
    },
    wallet:{
        type:Number,
        default:0
    },
    walletHistory:[{
        date:{
            type:Date
        },
        amount:{
            type:Number,
        },
        reason:{
            type: String,
        },
        cancelOderId:{
            type: String,
        }
    }]
});

module.exports = mongoose.model("User", userSchema);
