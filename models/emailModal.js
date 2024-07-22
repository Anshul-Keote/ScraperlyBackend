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
    orderId:{
        type:mongoose.Schema.ObjectId,
        ref:"Orders",
        required:true
    },
    personId:{
        type:mongoose.Schema.ObjectId,
        required:true
    },
    error:{
        type:Boolean,
        require:true
    }
});

module.exports = mongoose.model("Emails", emailSchema);