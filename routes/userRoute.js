const express = require("express");
const user_route = express();

user_route.set("view engine", "ejs");
user_route.set("views", "./views/users");

const bodyParser = require("body-parser");
user_route.use(bodyParser.json());
user_route.use(bodyParser.urlencoded({ extended: true }));

const userController = require("../controllers/userController");
const Auth = require("../midileware/userAuth");
//===================================register=====================================

user_route.get("/register", Auth.isLogout, userController.loadRegister);
user_route.post("/register", Auth.isLogout, userController.insertUser);

//===================================home=========================================

user_route.get("/", Auth.islogin, userController.homeload);
user_route.get("/", userController.homeload);

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

module.exports = user_route;
