const User = require("../models/userModel");
const productdata = require("../models/productModel");
const path = require("path");
const error500 = path.join(__dirname, "views", "error.html");
const islogin = async (req, res, next) => {
  try {
    if (req.session.user_id) {
      const blockedUser = await User.findOne({ _id: req.session.user_id });
      if (blockedUser.is_verified === 0) {
        next();
      } else {
        req.session.user_id = null;
        res.redirect("/login");
      }
      // res.redirect("/");
    } else {
      const products = await productdata.find();
      // res.render("home", { user: false, products: products });
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).sendFile(error500);
  }
};

const isLogout = async (req, res, next) => {
  try {
    if (req.session.user_id) {
      res.redirect("/");
    } else {
      next();
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).sendFile(error500);
  }
};
module.exports = {
  islogin,
  isLogout,
};
