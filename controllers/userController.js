const User = require("../models/userModel");
const productdata = require("../models/productModel");
const Cate = require("../models/category");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();
const otpGenerator = require("otp-generator");
const express = require("express");
const crypto = require("crypto");
const randomstring = require("randomstring");
const app = express();
const Address = require("../models/address");
const Order = require("../models/oderModel");
const Coupon = require("../models/couponModel");
const Offer = require("../models/offerModel");
const path = require("path");
const error500 = path.join(__dirname, 'views', 'error.html')

//==========================================securePassword=============================================

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

//==========================================loadRegister=============================================

const loadRegister = async (req, res) => {
  try {
    res.render("registration");
  } catch (error) {
    console.log(error.message);
  }
};
//==========================================sendVerifyMail============================================

const sendVerifyMail = async (email, name, otp) => {
  try {    
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    const mailOptions = {
      from: "suhail701953@gmail.com",
      to: email,
      subject: "One-Time Password for Verifying Your Account",

      html: `
      <div class="otp-container" style="width: 300px; margin: 0 auto; padding: 20px; border: 1px solid #ccc;">
        <h2 class="otp-title" style="font-size: 24px; font-weight: bold; text-align: center;">One-Time Password</h2>
        <p class="otp-message" style="font-size: 16px; text-align: center;">Hai ${name} Please use the following OTP to verify your account:</p>
        <span class="otp-code" style="font-size: 24px; font-weight: bold; text-align: center justify-content center;">${otp}</span>
      </div>
    `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log("Email has been sent:", info.response);
      }
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).sendFile(error500)
  }
};

//==========================================insertUser================================================
const insertUser = async (req, res) => {
  try {
    const existingUser = await User.findOne({ email: req.body.email });

    if (existingUser) {
      res.render("registration", {
        message: "This email is already in use. Please choose another one.",
      });
    } else {
      req.session.name = req.body.name;
      req.session.email = req.body.email;
      req.session.mobile = req.body.mobile;
      req.session.password = req.body.password;
      req.session.referralCode = req.body.referralCode;
      const referralCode = req.body.referralCode
      const userData=await User.findOne({ referralCode:referralCode})
      if(!userData&&referralCode==null){
        res.render("registration", { message: "Rong ReferralCode" });
      }else {
      if (req.body.password === req.body.confirmPassword) {
        const generatedOTP = generateAndStoreOTP(req);
        sendVerifyMail(req.session.email, req.session.name, generatedOTP);
        res.redirect("/verify");
      } else {
        res.render("registration", { message: "Enter same password" });
      }
    }
  }
  } catch (error) {
    console.log(error);
    res.status(500).sendFile(error500)
  }
};

//==========================================generateAndStoreOTP===========================================

function generateAndStoreOTP(req) {
  const otp = otpGenerator.generate(6, {
    digits: true,
    alphabets: false,
    specialChars: false,
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
  });

  const otpGenTime = Date.now() / 1000;
  const otpExrTime = otpGenTime + 45;

  req.session.otp = {
    code: otp,
    expiry: otpExrTime,
  };

  return otp; // Return the generated OTP if needed
}
//==========================================chekotp===========================================

const checkotp = async (req, res) => {
  try {
    const verifyotp = req.body.otp;
    const currTime = Math.floor(Date.now() / 1000);
    const charset =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    const charsetLength = charset.length;

    const length = 8;

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charsetLength);
      result += charset.charAt(randomIndex);
    }

    if (req.session && req.session.otp && currTime <= req.session.otp.expiry) {
      if (req.session.otp.code == verifyotp) {
        const spassword = await securePassword(req.session.password);
      
        const user = new User({
          name: req.session.name,
          email: req.session.email,
          password: spassword,
          mobile: req.session.mobile,
          referralCode:result,    
          usedReferralCode:req.session.referralCode,
          wallet:0,
          is_Verified: 1,
        });
        
        const userData = await user.save();

       

         const referralCode = req.session.referralCode;

         const resulttow = await User.findOneAndUpdate(
          { usedReferralCode: referralCode },
          { $set: { wallet: 25 } },
          { new: true }
        );
        
        // The console.log below is trying to access result, but it might not be initialized yet.
        
         // The issue is here: result is declared but not assigned a value yet.
         const resultone = await User.findOneAndUpdate(
           { referralCode: referralCode },
           { $set: { wallet: 50 } },
           { new: true }
         );
         
         // The console.log below is trying to access result, but it might not be initialized yet.
         
         
      

        if (userData) {
          req.session.user_id = userData._id;
          res.redirect("/login");
        }
      } else {
        res.render("otpverify", { message: "Invalid OTP" });
      }
    } else {
      res.render("otpverify", { message: "OTP is expired. Resend OTP" });
    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).sendFile(error500)

  }
};

//==========================================resendOTP=================================================

const resendOTP = async (req, res) => {
  try {
    const generatedOTP = generateAndStoreOTP(req);
    const name = req.session.name; // Assign the value of name to section

    sendVerifyMail(req.session.email, name, generatedOTP); // Use name here

    return res.redirect("/verify");
  } catch (error) {
    console.error(error.message);
    return res.status(500).sendFile(error500)
  }
};

//==========================================homeload=================================================

const homeload = async (req, res) => {
  try {
    const userData = await User.findById(req.session.user_id);
    const products = await productdata.find({ blocked: 0 });
    req.session.success = false;
    res.render("home", { user: userData, products: products });
  } catch (error) {
    console.log(error.message);
    res.status(500).sendFile(error500)
  }
};

//==========================================otp=================================================

const otp = async (req, res) => {
  try {
    res.render("otpverify");
  } catch (error) {
    console.log(error.message);
    res.status(500).sendFile(error500)
  }
};

//==========================================login=================================================

const login = async (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    console.log(error.message);
    res.status(500).sendFile(error500)
  }
};
//==========================================userLogout=================================================

const userLogout = async (req, res) => {
  try {
    req.session.user_id = null;
    res.redirect("/login");
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
};
//==============================================loadhome=============================================
const loadhome = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const userData = await User.findOne({ email: email });

    if (userData) {
      // Check if the user is verified
      if (userData.is_verified === 1) {
        res.render("login", { message: "USER NOT VERIFIED" });
        return; // Stop further execution
      }

      const passwordMatch = await bcrypt.compare(password, userData.password);

      if (passwordMatch) {
        req.session.user_id = userData._id;
        res.redirect("/");
      } else {
        res.render("login", { message: "PASSWORD INCORRECT" });
      }
    } else {
      res.render("login", { message: "EMAIL INCORRECT" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

//==============================================userprofile============================================
const userprofile = async (req, res) => {
  try {
    const user_id = req.session.user_id;
    const userData = await User.findById(user_id);
    const AddressData = await Address.find({ user: user_id });
    const orderData = await Order.find({ userId: user_id }).sort({ date: -1 });
    const totalPrice = orderData.totalAmount;

    const userData1 = await User.findOne({ _id: req.session.user_id });
    let walletAmount;
    let walletHistory;
    if (userData1) {
      walletAmount = userData1.wallet;
      walletHistory = userData1.walletHistory;
    }

    const coupons = await Coupon.find({
      status: true,
      expiryDate: { $gte: new Date() },
    });

    if (userData && AddressData) {
      res.render("userprofile", {
        user: userData,
        walletHistory: walletHistory,
        walletAmount: walletAmount,
        add: AddressData,
        coupons: coupons,
        oderData: orderData,
      });
    } else {
      res.render("userprofile", { user: false });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).sendFile(error500)
  }
};

//==============================================userprofile============================================

const product = async (req, res) => {
  try {
    const userData = await User.findById(req.session.user_id);
    var page = 1;
    var limit = 8;
    if (req.query.page) {
      page = req.query.page;
    }
    const products = await productdata
  .find({ blocked: 0 })
  .limit(limit)
  .skip((page - 1) * limit)
  .populate("offer");


    // const productData = await productdata.find({}).populate("offer");
    const catedata = await Cate.find({ blocked: 0 });
    const cateDatas = await Cate.find({}).populate("offer");
    const offerdata = await Offer.find({})

    const count = await productdata.find({ blocked: 0 }).countDocuments();
    const totalPages = Math.ceil(count / limit);


    res.render("shop", {
      user: userData,
      products,
      category: catedata,
      currentPage: page,
      totalPages: totalPages,
      cateDatas,
      offerdata


    });
  } catch (error) {
    console.log(error.message);
    res.status(500).sendFile(error500)
  }
};

//========================================shop================================
const productdeteal = async (req, res) => {
  try {
    const userData = await User.findById(req.session.user_id);
    const product = await productdata.findOne({ _id: req.query.id }).populate("offer");
    if (userData && product) {
      res.render("Productsdetail", { user: userData, product: product });
    } else {
      res.render("Productsdetail", { user: false, product });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).sendFile(error500)
  }
};
//========================================forgetpassword================================

const forgetpassword = async (req, res) => {
  try {
    res.render("forgetpassword");
  } catch (error) {
    console.log(error.message);
    res.status(500).sendFile(error500)
  }
};

//========================================forgetpassword================================

const forgetsendmail = async (req, res) => {
  try {
    const email = req.body.email;
    const userData = await User.findOne({ email: email });
    if (userData) {
      if (userData.is_verified === 0) {
        const randomS = randomstring.generate();
        const updatedData = await User.updateOne(
          {
            email: email,
          },
          {
            $set: {
              token: randomS,
            },
          }
        );
        passRecoverVerifyMail(userData.name, email, randomS);
        res.render("login", {
          message: "Successfully sent email. Check your mail.",
        });
      }
    } else {
      res.render("forgetpassword", {
        message: "Email not found. Please try again.",
      });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).sendFile(error500)
  }
};

//==========================================passRecoverVerifyMail=============================================

const passRecoverVerifyMail = async (name, email, token) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
      user: process.env.EMAIL_USER,
        pass: "kibv yizd iomd mgwf",
      },
    });
    const mailOptions = {
      from: "suhail701953@gmail.com",
      to: email,
      subject: "For Recover Password",

      html:
        "<h2>Dear " +
        name +
        ' ,please click here to <a href="http://localhost:3000/resetpassword?token=' +
        token +
        '">Reset</a> your password </h2>',
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log("Email has been sent:", info.response);
      }
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).sendFile(error500)
  }
};

//==========================================resetpassword=============================================

const resetpassword = async (req, res) => {
  try {
    const token = req.query.token;
    const tokenData = await User.findOne({ token: token });

    res.render("resetPassword", { user: tokenData });
  } catch (error) {
    console.log(error.message);
    res.status(500).sendFile(error500)
  }
};

//==========================================reSetpass=============================================

const reSetpass = async (req, res) => {
  try {
    const password = req.body.password;
    const id = req.body.id;

    const secPassword = await securePassword(password);

    const updatedData = await User.updateOne(
      { _id: id },
      {
        $set: { password: secPassword, token: "" },
      }
    );

    if (updatedData) {
      res.render("login", { message: "Password reset successful." });
    } else {
    }
  } catch (error) {
    console.log("Error:", error.message);
    res.status(500).sendFile(error500)
  }
};

//==========================================contact=============================================

const contact = async (req, res) => {
  try {
    const userData = await User.findById(req.session.user_id);
    if (userData) {
      res.render("contact", { user: userData });
    } else {
      res.render("contact", { user: false });
    }
  } catch (error) {
    console.log("Error:", error.message);
    res.status(500).sendFile(error500)
  }
};
//==========================================filterproduct=============================================

const filterproduct = async (req, res) => {
  try {
    const user = req.session.user_id;
    let cate = req.body.category;
    let priceSort = parseInt(req.body.price);
    const category = await Cate.find({ blocked: 0 });
    let filtered;
    if (req.body.category === "allCate") {
      filtered = await productdata
        .find({ blocked: 0 })
        .sort({ price: priceSort });
    } else {
      filtered = await productdata
        .find({ categoryName: cate, blocked: 0 })
        .sort({
          price: priceSort,
        });
    }
    res.render("shop", {
      user,
      products: filtered,
      totalPages: 0,
      category,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).sendFile(error500)
  }
};
//==========================================searchproduct=============================================

const searchproduct = async (req, res) => {
  try {
    const user = req.session.user_id;
    const category = await Cate.find({ blocked: 0 });
    const searchTerm = req.query.q;
    
    // Always use full string search
    const regex = new RegExp(`${searchTerm}`, "i");

    const products = await productdata.find({
      name: { $regex: regex },
      blocked: 0,
    });

    res.render("shop", {
      user,
      products: products,
      totalPages: 0,
      category,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).sendFile(error500);
  }
};

         
const loadError = async (req, res) => {
  try {
    res.status(404).render("404");
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  loadRegister,
  insertUser,
  homeload,
  login,
  userprofile,
  otp,
  checkotp,
  resendOTP,
  userLogout,
  loadhome,
  product,
  productdeteal,
  forgetpassword,
  forgetsendmail,
  resetpassword,
  reSetpass,
  contact,
  filterproduct,
  searchproduct,
  loadError
};
