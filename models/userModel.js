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

    is_verified:{
        type:Number,
        default:0
    },
    is_admin:{
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model("User", userSchema);
