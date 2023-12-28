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
const couponController = require("../controllers/couponController");
const offerController = require("../controllers/offerController");

//===================================adminlogin=============================================

admin_route.get("/", Auth.isLogout, adminController.loadlogin);
admin_route.post("/", Auth.isLogout, adminController.loginadmin);

//===================================dashbord================================================

admin_route.get("/adminhome",  Auth.isLogin,adminController.dashbord);

//===================================adminlogout=============================================

admin_route.get("/adminlogout", Auth.isLogin, adminController.adminLogout);

//===================================adminlogout=============================================

admin_route.get("/userdata", Auth.isLogin, adminController.showuser);

//===================================user = block/unbock=====================================

admin_route.get("/block", Auth.isLogin, adminController.userunblock);

//===================================Cate = block/unbock=====================================

admin_route.get("/block-cat", Auth.isLogin, adminController.unandblock);
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

admin_route.get("/Product", Auth.isLogin, productController.productlist);
admin_route.get("/addProduct",  Auth.isLogin,productController.addProduct);
admin_route.post(
  "/addProduct", Auth.isLogin,
  multer.productImagesUpload,
  productController.inserproduct
);
admin_route.post(
  "/editProduct", Auth.isLogin,
  multer.productImagesUpload,
  productController.editProduct
);

//==================================productblock================================================

admin_route.get("/block-pro", Auth.isLogin, productController.problock);
admin_route.get("/updeteproduct",  Auth.isLogin,productController.prouppage);

//==================================category====================================================

admin_route.get("/category", Auth.isLogin, adminController.category);
admin_route.get("/addCategory", Auth.isLogin, adminController.addCategory);
admin_route.post("/addCate", Auth.isLogin, adminController.addCate);

//==================================orderManage====================================================

admin_route.get("/orderManage", Auth.isLogin, orderController.orderManage);
admin_route.get(
  "/orderFullDetails",
  Auth.isLogin,
  orderController.orderFullDetails
);
admin_route.get("/statusUpdate", Auth.isLogin, orderController.statusUpdate);

//==================================coupenMange====================================================

admin_route.get("/coupenMange", Auth.isLogin, couponController.coupen);
admin_route.get("/addCoupon", Auth.isLogin, couponController.showCoupon);
admin_route.post("/addCoupon", Auth.isLogin, couponController.addCoupon);
admin_route.get("/block-coupons", Auth.isLogin, couponController.blockCoupons);
admin_route.get(
  "/edit-coupon-page",
  Auth.isLogin,
  couponController.showEditPage
);
admin_route.post("/editCoupon", Auth.isLogin, couponController.updateCoupon);

admin_route.get("/offerMange", Auth.isLogin, offerController.offerpage);
admin_route.get("/addOffer", Auth.isLogin, offerController.addofferpage);
admin_route.post("/offeradd", Auth.isLogin, offerController.offeradd)
admin_route.get("/block-Offer", Auth.isLogin, offerController.blockOffer);
admin_route.get("/edit-offer-page",Auth.isLogin,offerController.editofferpage);
admin_route.post("/editoffer",offerController.editoffer)
admin_route.post("/cateaddoffer", Auth.isLogin,offerController.cateapplyoffer)
admin_route.post("/proaddoffer", Auth.isLogin,offerController.proapplyoffer)
admin_route.post("/cateremoveoffer", Auth.isLogin,offerController.cateremoveoffer)
admin_route.post("/proremoveoffer", Auth.isLogin,offerController.proofferRemove)

admin_route.get('/chartWeek', Auth.isLogin, adminController.chartFilterWeek);
admin_route.get('/chartMonth', Auth.isLogin, adminController.chartFilterMonth);
admin_route.get('/chartYear', Auth.isLogin, adminController.chartFilterYear);
admin_route.get('/weeklySalesDataEndpoint', Auth.isLogin, adminController.weeklySalesDataEndpoint );




admin_route.get("/salesReport", Auth.isLogin,adminController.salesReport)
// admin_route.get("/salesfillter",admin_route.salesfillter)
admin_route.get('/saleSortPage/:id', Auth.isLogin, adminController.saleSorting)
admin_route.get("saleSortPage/custom", Auth.isLogin, adminController.saleSorting)

admin_route.get('/reportDown', Auth.isLogin, adminController.downloadReport)

module.exports = admin_route;
