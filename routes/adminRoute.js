const User = require("../models/userModel");
const express = require("express");
const nocache = require("nocache");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const crypto = require("crypto");
const secretKey = crypto.randomBytes(32).toString("hex");

const admin_route = express();

admin_route.use(
  session({
    secret: secretKey,
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 48 * 60 * 60 * 1000,
    },
  })
);

admin_route.use(cookieParser());
admin_route.use(nocache());

const bodyParser = require("body-parser");
admin_route.use(bodyParser.json());
admin_route.use(bodyParser.urlencoded({ extended: true }));

admin_route.set("view engine", "ejs");
admin_route.set("views", "./views/admin");

const adminController = require("../controllers/adminController");
const productController = require("../controllers/productController");
const multer = require("../midileware/mullter");
const Auth = require("../midileware/adminAuth");
const adddressController = require("../controllers/addressController");
const cartController = require("../controllers/cartController");
const orderController = require("../controllers/orderControoler");

//===================================adminlogin=============================================

admin_route.get("/", Auth.isLogout, adminController.loadlogin);
admin_route.post("/", Auth.isLogout, adminController.loginadmin);

//===================================dashbord================================================

admin_route.get("/adminhome", adminController.dashbord);

//===================================adminlogout=============================================

admin_route.get("/adminlogout", Auth.isLogin, adminController.adminLogout);

//===================================adminlogout=============================================

admin_route.get("/userdata", Auth.isLogin, adminController.showuser);

//===================================user = block/unbock=====================================

admin_route.get("/block", adminController.userunblock);

//===================================Cate = block/unbock=====================================

admin_route.get("/un-block", Auth.isLogin, adminController.unandblock);
admin_route.get("/cateDelete", Auth.isLogin, adminController.cateDelete);

admin_route.get("/cateUpdate", Auth.isLogin, adminController.cateuppage);
admin_route.post("/updatecategory", Auth.isLogin, adminController.editCate);

//===================================block/unbock=============================================

admin_route.get("/edituser", Auth.isLogin, adminController.edituser);
admin_route.post("/edituser", Auth.isLogin, adminController.updateuser);

//===================================deletuser================================================

admin_route.get("/deletuser", Auth.isLogin, adminController.deletuser);

//===================================newuser/adduser==========================================

admin_route.get("/newuser", Auth.isLogin, adminController.adduser);
admin_route.post("/adduser", Auth.isLogin, adminController.addtouser);

//===================================addproduct================================================

admin_route.get("/Product", productController.productlist);
admin_route.get("/addProduct", productController.addProduct);
admin_route.post(
  "/addProduct",
  multer.productImagesUpload,
  productController.inserproduct
);
admin_route.post(
  "/editProduct",
  multer.productImagesUpload,
  productController.editProduct
);

//==================================productblock================================================

admin_route.get("/problock", productController.problock);
admin_route.get("/updeteproduct", productController.prouppage);

//==================================category====================================================

admin_route.get("/category", Auth.isLogin, adminController.category);
admin_route.get("/addCategory", Auth.isLogin, adminController.addCategory);
admin_route.post("/addCate", Auth.isLogin, adminController.addCate);

//==================================orderManage====================================================

admin_route.get("/orderManage", orderController.orderManage);
admin_route.get("/orderFullDetails", orderController.orderFullDetails);
admin_route.get("/statusUpdate", orderController.statusUpdate);

module.exports = admin_route;
