const User = require("../models/userModel");
const productdata = require("../models/productModel");
const bcrypt = require("bcrypt");
const multer = require("../midileware/mullter");
const Sharp = require("sharp");
const Cate = require("../models/category");
const Address = require("../models/address");
const path = require("path");
const error500 = path.join(__dirname, 'views', 'error.html')

//==========================================editProfile=============================================

const editProfile = async (req, res) => {
  try {
    const update = await User.updateOne(
      { _id: req.session.user_id },
      {
        $set: {
          name: req.body.name,
          email: req.body.email,
          number: req.body.number,
        },
      }
    );
    if (update) {
      res.json({ success: true });
    }
  } catch (error) {
    console.log(error.message);
   res.status(500).sendFile(error500)
  }
};
//==========================================profile - addaddres2=============================================

const addaddres1 = async (req, res) => {
  try {
    const userData = await User.findById(req.session.user_id);
    if (userData) {
      res.render("addAddress", { user: userData });
    }
  } catch (error) {
    console.log(error.message);
   res.status(500).sendFile(error500)
  }
};

//==========================================addaddres2=============================================

const addaddres2 = async (req, res) => {
  try {
    const userData = await User.findById(req.session.user_id);
    if (userData) {
      res.render("addAddress2", { user: userData });
    }
  } catch (error) {
    console.log(error.message);
   res.status(500).sendFile(error500)
  }
};

//==========================================addresAdd=============================================


const addaddres21 = async (req, res) => {
  try {
    const user_id = req.session.user_id;
    const userid = req.body.id;
    if (user_id) {
      const address = new Address({
        user: user_id,
        name: req.body.name,
        mobile: req.body.mobile,
        email: req.body.email,
        houseName: req.body.houseName,
        city: req.body.city,
        state: req.body.state,
        pin: req.body.pin,
      });

      // Save the new address
      let result = await address.save();
      res.json({ success: true });
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.error(error.message);
   res.status(500).sendFile(error500)
  }
};
//==========================================addresAdd1=============================================

const addresAdd1 = async (req, res) => {
  try {
    const user_id = req.session.user_id;
    const userid = req.body.id;
    if (user_id) {
      const address = new Address({
        user: user_id,
        name: req.body.name,
        mobile: req.body.mobile,
        email: req.body.email,
        houseName: req.body.houseName,
        city: req.body.city,
        state: req.body.state,
        pin: req.body.pin,
      });

      // Save the new address
      let result = await address.save();
      res.json({ success: true });
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.error(error.message);
   res.status(500).sendFile(error500)
  }
};
//==========================================profile - editaddress=============================================

const editaddress1 = async (req, res) => {
  try {
    const id = req.query.id;
    const addaddresData = await Address.find({ _id: id });
    const userData = await User.findById(req.session.user_id);
    if (userData) {
      res.render("editAddress", { user: userData, addr: addaddresData });
    }
  } catch (error) {
    console.log(error.message);
   res.status(500).sendFile(error500)
  }
};

//==========================================editaddress2=============================================

const editaddress2 = async (req, res) => {
  try {
    const id = req.query.id;
    const addaddresData = await Address.find({ _id: id });
    const userData = await User.findById(req.session.user_id);
    if (userData) {
      res.render("editAddress2", { user: userData, addr: addaddresData });
    }
  } catch (error) {
    console.log(error.message);
   res.status(500).sendFile(error500)
  }
};

//==========================================updteaddress2=============================================

const updteaddress2 = async (req, res) => {
  try {
    const addressId = req.body.id;
    const userId = req.session.user_id;
    const updated = await Address.updateOne(
      { user: userId, _id: addressId }, // Find the user and the specific address by its ID
      {
        $set: {
          name: req.body.name,
          mobile: req.body.mobile,
          email: req.body.email,
          houseName: req.body.houseName,
          city: req.body.city,
          state: req.body.state,
          pin: req.body.pin,
        },
      }
    );


    res.json({ success: true });
  } catch (error) {
    console.log(error.message);
   res.status(500).sendFile(error500)
  }
};
//==========================================profilel - updteaddress2=============================================

const updteaddress1 = async (req, res) => {
  try {
    const addressId = req.body.id;
    const userId = req.session.user_id;
    const updated = await Address.updateOne(
      { user: userId, _id: addressId }, // Find the user and the specific address by its ID
      {
        $set: {
          name: req.body.name,
          mobile: req.body.mobile,
          email: req.body.email,
          houseName: req.body.houseName,
          city: req.body.city,
          state: req.body.state,
          pin: req.body.pin,
        },
      }
    );


    res.json({ success: true });
  } catch (error) {
    console.log(error.message);
   res.status(500).sendFile(error500)
  }
};

//==========================================removeAddress=============================================

const removeAddress = async (req, res) => {
  try {
    const id = req.body.id;

    const result = await Address.deleteOne(
      { user: req.session.user_id },
      { address: { _id: id } }
    );


    res.json({ remove: true });
  } catch (error) {
    console.log(error.message);
   res.status(500).sendFile(error500)
  }
};
//==========================================profile _removeAddress=============================================

const removeAddress1 = async (req, res) => {

  try {
    const id = req.body.id;
console.log(id);
    const result = await Address.deleteOne(
      { user: req.session.user_id },
      { address: { _id: id } }
    );


    res.json({ remove: true });
  } catch (error) {
    console.log(error.message);
   res.status(500).sendFile(error500)
  }
};

module.exports = {
  editProfile,
  addaddres1,
  addaddres21,
  editaddress1,
  addaddres2,
  addresAdd1,
  editaddress2,
  updteaddress2,
  removeAddress,
  updteaddress1,
  removeAddress1
};
