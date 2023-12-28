const Coupon = require("../models/couponModel");
const Cart = require("../models/cartModels");
const Order = require("../models/oderModel");

//============================coupen==============================

const coupen = async (req, res) => {
  try {
    const coupons = await Coupon.find();
    res.render("coupons", { coupons: coupons });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
//============================showCoupon==============================

const showCoupon = async (req, res) => {
  try {
    res.render("addCoupon");
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
//============================addCoupon==============================

const addCoupon = async (req, res) => {
  try {
    const regexName = new RegExp(req.body.name, "i");
    const already = await Coupon.findOne({ couponName: { $regex: regexName } });
    const regexCode = new RegExp(req.body.code, "i");
    const Codealready = await Coupon.findOne({
      couponCode: { $regex: regexCode },
    });
    const TodayDate = new Date();
    const Today = TodayDate.toISOString().split("T")[0];
    const active = new Date(req.body.activeDate);

    if (
      req.body.name.trim() === "" &&
      req.body.code.trim() === "" &&
      req.body.discount.trim() === "" &&
      req.body.activeDate.trim() === "" &&
      req.body.expDate.trim() === "" &&
      req.body.criteriaAmount.trim() === "" &&
      req.body.userLimit.trim() === ""
    ) {
      res.json({ require: true });
    } else if (already) {
      res.json({ nameAlready: true });
    } else if (Codealready) {
      res.json({ codeAlready: true });
    } else if (req.body.discount <= 0) {
      res.json({ disMinus: true });
    } else if (req.body.criteriaAmount <= 0) {
      res.json({ amountMinus: true });
    } else if (active < TodayDate) {
      res.json({ expDate: true });
    } else if (req.body.expDate < Today) {
      res.json({ expDate: true});
    } else if (req.body.userLimit <= 0) {
      res.json({ limit: true });
    } else {
      const data = new Coupon({
        couponName: req.body.name,
        couponCode: req.body.code,
        discountAmount: req.body.discount,
        activationDate: req.body.activeDate,
        expiryDate: req.body.expDate,
        criteriaAmount: req.body.criteriaAmount,
        usersLimit: req.body.userLimit,
      });
      await data.save();
      res.json({ success: true });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

//============================blockCoupons==============================

const blockCoupons = async (req, res) => {
  console.log("colled");
  try {
    console.log(req.query.id);
    const coupen = await Coupon.findOne({ _id: req.query.id });
    if (coupen.status == true) {
      await Coupon.updateOne(
        { _id: req.query.id },
        { $set: { status: false } }
      );
    } else {
      await Coupon.updateOne({ _id: req.query.id }, { $set: { status: true } });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const showEditPage = async (req, res) => {
  try {
    const couponData = await Coupon.findOne({ _id: req.query.id });
    res.render("editCoupon", { coupon: couponData });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
//============================updateCoupon==============================

const updateCoupon = async (req, res) => {
  try {
   
    const regexCode = new RegExp(req.body.code, "i");
    const Codealready = await Coupon.findOne({
      couponCode: { $regex: regexCode },
    });
    const TodayDate = new Date();
    const Today = TodayDate.toISOString().split("T")[0];
    const active = req.body.activeDate;
    if (
      req.body.name.trim() === "" &&
      req.body.code.trim() === "" &&
      req.body.discount.trim() === "" &&
      req.body.activeDate.trim() === "" &&
      req.body.expDate.trim() === "" &&
      req.body.criteriaAmount.trim() === "" &&
      req.body.userLimit.trim() === ""
    ) {
      res.json({ require: true });
    
    } else if (Codealready) {
      res.json({ codeAlready: true });
    } else if (req.body.discount <= 0) {
      res.json({ disMinus: true });
    } else if (req.body.criteriaAmount <= 0) {
      res.json({ amountMinus: true });
    } else if (active < TodayDate) {
      res.json({ expDate: true });
    } else if (req.body.expDate < Today) {
      res.json({ expDate: true});
    } else if (req.body.userLimit <= 0) {
      res.json({ limit: true });
    } else {
      const updated = await Coupon.updateOne(
        { _id: req.query.id },
        {
          $set: {
            couponName: req.body.name,
            couponCode: req.body.code,
            discountAmount: req.body.discount,
            activationDate: req.body.activeDate,
            expiryDate: req.body.expDate,
            criteriaAmount: req.body.criteriaAmount,
            usersLimit: req.body.userLimit,
          },
        }
      );
      if (updated) {
        res.json({ success: true });
      } else {
        res.json({ failed: true });
      }
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

//==============================DELETE APPLIED COUPON============================

const deleteAppliedCoupon = async (req, res) => {
  try {
    const code = req.body.code;
    req.session.code = false;
    const couponData = await Coupon.findOne({ couponCode: code });
    const amount = Number(req.body.amount);
    const disAmount = couponData.discountAmount;
    const disTotal = Math.round(amount + disAmount);
    // req.body.code=false;
    res.json({ success: true, disTotal });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

//================================APPLY COUPON====================================

const applyCoupon = async (req, res) => {
  try {
    const code = req.body.code;

    req.session.code = code;
    const amount = Number(req.body.amount);
    console.log(amount);

    const userExist = await Coupon.findOne({
      couponCode: code,
      usedUsers: { $in: [req.session.user_id] },
    });
    if (userExist) {
      res.json({ user: true });
    } else {
      const couponData = await Coupon.findOne({ couponCode: code });
      console.log(couponData);
      if (couponData) {
        if (couponData.usersLimit <= 0) {
          res.json({ limit: true });
        } else {
          if (couponData.status == false) {
            res.json({ status: true });
          } else {
            if (couponData.expiryDate <= new Date()) {
              res.json({ date: true });
            } else if (couponData.activationDate >= new Date()) {
              res.json({ active: true });
            } else {
              if (couponData.criteriaAmount >= amount) {
                res.json({ cartAmount: true });
              } else if (couponData.discountAmount >= amount) {
                res.json({ activeone: true });
              } 
              else {
               
                const disAmount = couponData.discountAmount;
                const disTotal = Math.round(amount - disAmount);
                console.log(disAmount,disTotal);
                return res.json({ amountOkey: true, disAmount, disTotal });
              }
            }
          }
        }
      } else {
        res.json({ invalid: true });
      }
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  coupen,
  showCoupon,
  addCoupon,
  blockCoupons,
  showEditPage,
  updateCoupon,
  applyCoupon,
  deleteAppliedCoupon,
};
