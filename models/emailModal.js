const mongoose = require("mongoose");

const emailSchema = new mongoose.Schema({
    email:{
        type:String,
        required:true,
    },
    score: {
        type:Number,
        required:true,
    },
    is_catchall:{
        type:Boolean,
        required:true,
        default:false
    },
    mx_record:{
        type:String,
        required:true,
        default:"None"
    },
    provider:{
        type:String,
        default:null
    },
    isv_format:{
        type:Boolean,
        default:null
    },
    isv_domain:{
        type:Boolean,
        default:null
    },
    isv_mx:{
        type:Boolean,
        default:null
    },
    isv_noblock:{
        type:Boolean,
        default:null
    },
    isv_nocatchall:{
        type:Boolean,
        default:null
    },
    isv_nogeneric:{
        type:Boolean,
        default:null
    },
    is_free:{
        type:Boolean,
        default:null
    },
    result:{
        type:String,
        default:null
    },
    reason:{
        type:String,
        default:null
    }
});

module.exports = mongoose.model("Emails", emailSchema);