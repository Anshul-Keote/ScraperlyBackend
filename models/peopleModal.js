const { type } = require("express/lib/response");
const mongoose = require("mongoose");

const peopleSchema = new mongoose.Schema({
    orderId:{
        type:mongoose.Schema.ObjectId,
        ref:"Orders",
        required:true,
    },
    data:{
        type:Object,
        required:true,
    }
});

module.exports = mongoose.model("People", peopleSchema);