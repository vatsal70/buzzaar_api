const express = require("express");
const { registerSeller, 
        loginSeller, 
        logoutSeller, 
        forgotPassword, 
        resetPassword, 
        getSellerDetails, 
        updatePassword, 
        updateProfile, 
        getAllSellers,
        getSingleSeller,
        updateSellerRole,
        deleteSeller} = require("../controllers/SellerController");


const { isAuthenticatedUser, authorizeRole } = require("../middleware/auth");

const router = express.Router();

router
    .route("/register")
    .post(registerSeller)

router
    .route("/login")
    .post(loginSeller)

router
    .route("/password/forgot")
    .post(forgotPassword)

router
    .route("/password/reset/:token")
    .put(resetPassword)

router
    .route("/logout")
    .get(logoutSeller)

router
    .route("/me")
    .get(isAuthenticatedUser, getSellerDetails)

router
    .route("/password/update")
    .put(isAuthenticatedUser, updatePassword);

router
    .route("/me/update")
    .put(isAuthenticatedUser, updateProfile);

router
    .route("/admin/Sellers")
    .get(isAuthenticatedUser, authorizeRole("admin"), getAllSellers)

router
    .route("/admin/Seller/:id")
    .get(isAuthenticatedUser, authorizeRole("admin"), getSingleSeller)
    .put(isAuthenticatedUser, authorizeRole("admin"), updateSellerRole)
    .delete(isAuthenticatedUser, authorizeRole("admin"), deleteSeller)

module.exports = router;