const ErrorHandler = require("../utils/errorhandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const Seller = require("../models/sellerModel");
const sendToken = require("../utils/jwtToken");
const sendEmail = require("../utils/sendEmail.js")
const crypto = require("crypto");

//Registering Seller
exports.registerSeller = catchAsyncErrors(async(req, res, next)=>{
    const {name, email, password} = req.body;

    const seller = await Seller.create({
        name,
        email,
        password,
        avatar: {
            public_id: "This is a sample id",
            url: "profilePicUrl"
        }
    });

    sendToken(seller, 201, res);
})

//Seller login
exports.loginSeller = catchAsyncErrors (async (req, res, next)=>{
    const {email, password} = req.body;

    //checking if Seller has given password and email both

    if(!email || !password){
        return next(new ErrorHandler("Please Enter Email & Password"))
    }

    const seller = await Seller.findOne({email}).select("+password");

    if(!seller){
        return next(new ErrorHandler("Invalid email or password", 401))
    }

    const isPasswordMatched = await Seller.comparePassword(password);

    if (!isPasswordMatched) {
        return next(new ErrorHandler("Invalid email or password", 401));
    }

    sendToken(seller, 200, res);
})

//Logout Seller
exports.logoutSeller = catchAsyncErrors(async(req, res, next)=>{
    
    res.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true
    })
    
    res.status(200).json({
        success: true,
        message: "Logged out"
    })
})

//Forgot password
exports.forgotPassword = catchAsyncErrors(async(req, res, next)=>{
    const seller = await Seller.findOne({email: req.body.email});

    if(!seller){
        return next(new ErrorHandler("Seller not found", 404))
    }

    //Get resetpassword token
    const resetToken = Seller.getResetPasswordToken();

    await seller.save({ validateBeforeSave: false});

    const resetPasswordUrl = `${req.protocol}://${req.get("host")}/api/v1/password/reset/${resetToken}`;

    const message = `Your password reset token is :- \n\n ${resetPasswordUrl} \n\n If you have not requested this email then please ignore it`;

    try {
        await sendEmail({
            email:seller.email,
            subject: `Buzzaar Password Recovery`,
            message
        })

        res.status(200).json({
            success: true,
            message: `Email sent to ${Seller.email} successfully`
        })
    } catch (error) {
        Seller.resetPasswordToken = undefined;
        Seller.resetPasswordExpire = undefined;

        await Seller.save({ validateBeforeSave: false});

        return next(new ErrorHandler(error.message, 500))
    }
})

//Reset Password 
exports.resetPassword = catchAsyncErrors(async (req, res, next)=>{
    
    //created hashed token
    const resetPasswordToken = crypto
        .createHash("sha256")
        .update(req.params.token)
        .digest("hex")

    const Seller = await Seller.findOne({
        resetPasswordToken,
        resetPasswordExpire:{ $gt: Date.now() },
    })

    if(!Seller){
        return next(new ErrorHandler("Reset Password Token is invalid or has been expired", 400))
    }

    if(req.body.password !== req.body.confirmPassword){
        return next(new ErrorHandler("Passwords don't match", 400))
    }

    Seller.password = req.body.password;
    Seller.resetPasswordToken = undefined;
    Seller.resetPasswordExpire = undefined;

    await Seller.save();

    sendToken(Seller, 200, res);
})

//Get Seller Details
exports.getSellerDetails = catchAsyncErrors(async(req, res, next)=>{
    const Seller = await Seller.findById(req.Seller.id);

    res.status(200).json({
        success: true,
        Seller
    })
})

//Update Seller password
exports.updatePassword = catchAsyncErrors(async (req, res, next)=>{
    const Seller = await Seller.findById(req.Seller.id).select("+password");

    const isPasswordMatched = await Seller.comparePassword(req.body.oldPassword);

    if (!isPasswordMatched) {
        return next(new ErrorHandler("Old password is incorrect", 400));
    }

    if(req.body.newPassword !== req.body.confirmPassword){
        return next(new ErrorHandler("Password does not match", 400));
    }

    Seller.password = req.body.newPassword

    await Seller.save();

    sendToken(Seller, 200, res);

})

//update Seller Profile
exports.updateProfile = catchAsyncErrors(async (req, res, next)=>{
    
    const newSellerData = {
        name: req.body.name,
        email: req.body.email
    }

    //We will add cloudinary later

    const Seller = await Seller.findByIdAndUpdate(req.Seller.id, newSellerData, {
        new: true,
        runValidators: true,
        useFindAndModify: false
    })

    res.status(200).json({
        success: true
    })

})

//Get All Sellers -->  Admin
exports.getAllSellers = catchAsyncErrors(async (req, res, next)=>{
    const Sellers = await Seller.find();

    res.status(200).json({
        success: true,
        Sellers
    })
})

//Get Single Seller -->  Admin
exports.getSingleSeller = catchAsyncErrors(async (req, res, next)=>{
    const Seller = await Seller.findById(req.params.id);

    if(!Seller){
        return next(new ErrorHandler(`Seller doesn't exist with Id: ${req.aparams.id}`))
    }

    res.status(200).json({
        success: true,
        Seller
    })
})

//Update Seller Role --> Admin
exports.updateSellerRole = catchAsyncErrors(async (req, res, next)=>{
    
    const newSellerData = {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role
    }

    const Seller = await Seller.findByIdAndUpdate(req.params.id, newSellerData, {
        new: true,
        runValidators: true,
        useFindAndModify: false
    })

    res.status(200).json({
        success: true
    })

}) 

//Delete Seller --> Admin
exports.deleteSeller = catchAsyncErrors(async (req, res, next)=>{
    
    const Seller = await Seller.findById(req.params.id)
    // we will remove cloudinary later

    if(!Seller){
        return next(new ErrorHandler(`Seller does not exist with Id: ${req.params.id}`))
    }

    await Seller.remove();
 
    res.status(200).json({
        success: true,
        message: "Seller deleted succesfully"
    })
})