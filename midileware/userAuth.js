const User = require("../models/userModel");
const productdata = require("../models/productModel");

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
  }
};
module.exports = {
  islogin,
  isLogout,
};
