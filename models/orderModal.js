const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    createdAt:{
        type:String,
        required:true,
    },
    noOfLeads:{
        type:Number,
        required:true,
    },
    name: {
        type:String,
        required:true,
    },
    email: {
        type:String,
        required:true,
    },
    apolloUrl: {
        type:String,
        required:true,
    },
    fileName: {
        type:String,
        required:true,
    },
    paymentStatus: {
        type:Boolean,
        default:false,
        required:true,
    },
    data: [],
});

module.exports = mongoose.model("Orders", orderSchema);