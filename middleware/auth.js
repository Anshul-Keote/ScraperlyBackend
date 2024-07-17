const ErrorHandler = require("../utils/errorhandler");
const catchAsyncErrors = require("./catchAsyncErrors");
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModal");
exports.isAuthenticatedUser = catchAsyncErrors(async (req, res, next) => {
    let { token } = req.cookies;
    if(!token){
        token = req.query.token; 
    }
    console.log("TOKEN  : ", token);
    console.log("cookies : " , req.cookies );
    
    if (!token) {
        return next(new ErrorHandler("Please Login to access this resource", 401));
    }

    const decodedData = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await userModel.findById(decodedData.id);
    next();
});