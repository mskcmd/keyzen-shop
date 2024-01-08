const express = require("express");
const user_route = express();

user_route.set("view engine", "ejs");
user_route.set("views", "./views/users");

const bodyParser = require("body-parser");
user_route.use(bodyParser.json());
user_route.use(bodyParser.urlencoded({ extended: true }));

const userController = require("../controllers/userController");
const Auth = require("../midileware/userAuth");
const adddressController = require("../controllers/addressController");
const cartController = require("../controllers/cartController");
const orderController = require("../controllers/orderControoler");
const WishlistController = require("../controllers/wishlistController");
const couponController = require("../controllers/couponController");

//======================================404=====================================
user_route.get('/error',userController.loadError)

//===================================register=====================================

user_route.get("/register", Auth.isLogout, userController.loadRegister);
user_route.post("/register", Auth.isLogout, userController.insertUser);

//===================================home=========================================

user_route.get("/", userController.homeload);
// user_route.get("/", userController.homeload);

//===================================verify========================================

user_route.get("/verify", Auth.isLogout, userController.otp);
user_route.post("/verify", Auth.isLogout, userController.checkotp);
user_route.get("/resend", Auth.isLogout, userController.resendOTP);

//===================================login=========================================

user_route.get("/login", Auth.isLogout, userController.login);
user_route.post("/login", Auth.isLogout, userController.loadhome);

//===================================logout=========================================

user_route.get("/logout", Auth.islogin, userController.userLogout);

//===================================product========================================

user_route.get("/product", userController.product);
user_route.post("/filterproduct", userController.filterproduct);
// /user_route.get("/search",userController.search)
user_route.get("/prosearch", userController.searchproduct);

//===================================userprofile====================================

user_route.get("/account", Auth.islogin, userController.userprofile);
user_route.get("/productdeteal", userController.productdeteal);

//===================================forgetpassword=================================

user_route.get("/forgetpassword", userController.forgetpassword);
user_route.post("/forgetpass", userController.forgetsendmail);

//===================================resetpassword==================================

user_route.get("/resetpassword", userController.resetpassword);
user_route.post("/reSetpass", userController.reSetpass);

//===================================contact========================================

user_route.get("/contact", userController.contact);



//===================================addtocart========================================

user_route.post("/addtocart", cartController.addtocart);
user_route.get("/cartpage", Auth.islogin, cartController.cartpage);
user_route.post("/removeCartItem", Auth.islogin, cartController.removeCartItem);
user_route.post("/updatecart", cartController.changeCartQuantity);

//===================================chekout========================================

user_route.get("/loadchekout", Auth.islogin, cartController.loadchekout);
user_route.get("/landchekout", Auth.islogin, cartController.landchekout);


//===================================profile - addaddres========================================
user_route.get("/addaddres1", Auth.islogin, adddressController.addaddres1);
user_route.post("/addresAdd1", Auth.islogin, adddressController.addaddres21);
user_route.get("/editaddress1", Auth.islogin, adddressController.editaddress1);

user_route.post(
  "/updateaddress1",
  Auth.islogin,
  adddressController.updteaddress1
);

user_route.post(
  "/removeAddress1",
  Auth.islogin,
  adddressController.removeAddress1
);

//===================================addaddres========================================

user_route.get("/addaddres2", Auth.islogin, adddressController.addaddres2);
user_route.post("/addresAdd2", Auth.islogin, adddressController.addresAdd1);
user_route.get("/editaddress2", Auth.islogin, adddressController.editaddress2);
user_route.post(
  "/updateaddress",
  Auth.islogin,
  adddressController.updteaddress2
);
user_route.post(
  "/removeAddress",
  Auth.islogin,
  adddressController.removeAddress
);

//===================================editProfile========================================

user_route.post("/editProfile", adddressController.editProfile);

//===================================order========================================

user_route.post("/placeOrder", Auth.islogin, orderController.placeOrder);
user_route.get(
  "/viewOrderDetails",
  Auth.islogin,
  orderController.viewOrderDetails
);
user_route.post("/orderCancel", Auth.islogin, orderController.orderCancel);
user_route.post("/productReturn", Auth.islogin, orderController.orderReturn);
user_route.get("/orderSuccess", Auth.islogin, orderController.orderSuccess);
user_route.get("/home", Auth.islogin, orderController.homeOrderBtn);
user_route.post("/verify-payment", orderController.verifyPayment);

//===================================Wishlist========================================

user_route.get("/Wishlist", Auth.islogin, WishlistController.showwish);
user_route.post(
  "/addToWishlist",
  Auth.islogin,
  WishlistController.addToWishlist
);
user_route.post("/removeWish", Auth.islogin, WishlistController.removeWishItem);

//===================================Coupon========================================

user_route.post("/applyCoupon", Auth.islogin, couponController.applyCoupon);
user_route.post(
  "/deleteAppliedCoupon",
  Auth.islogin,
  couponController.deleteAppliedCoupon

);
user_route.get('/invoice/:id', Auth.islogin, orderController.orderInvoice)



module.exports = user_route;
