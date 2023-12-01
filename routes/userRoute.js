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


//===================================register=====================================

user_route.get("/register", Auth.isLogout, userController.loadRegister);
user_route.post("/register", Auth.isLogout, userController.insertUser);

//===================================home=========================================

user_route.get("/",  userController.homeload);
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

user_route.get('/addaddres',adddressController.addaddres)
user_route.post("/addaddress",adddressController.addresAdd)

user_route.get("/editaddress",adddressController.editaddress)


user_route.get("/editaddress",adddressController.editaddress)

user_route.post("/addtocart",cartController.addtocart)


user_route.get("/cartpage",Auth.islogin,cartController.cartpage)

user_route.post("/removeCartItem",Auth.islogin,cartController.removeCartItem)
user_route.post("/updatecart",cartController.changeCartQuantity)

user_route.get("/loadchekout",cartController.loadchekout)

user_route.get("/landchekout",cartController.landchekout)
user_route.get('/addaddres2',adddressController.addaddres2)

user_route.post("/addresAdd2",adddressController.addresAdd1)
user_route.get("/editaddress2",adddressController.editaddress2)
user_route.post("/updateaddress", adddressController.updteaddress2);
 
user_route.post("/editProfile",adddressController.editProfile)

user_route.post("/placeOrder",Auth.islogin,orderController.placeOrder)

user_route.get("/viewOrderDetails",orderController.viewOrderDetails)
 
user_route.post("/orderCancel",orderController.orderCancel)
user_route.post ("/removeAddress",adddressController.removeAddress)

user_route.get("/orderSuccess",orderController.orderSuccess)
user_route.get("/home",orderController.homeOrderBtn)


module.exports = user_route;
