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
    mx_record:{
        type:String,
        required:true,
        default:"None"
    },
});

module.exports = mongoose.model("Emails", emailSchema);