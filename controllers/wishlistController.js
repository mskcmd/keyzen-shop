const express = require("express");
const User = require("../models/userModel");
const Product = require("../models/productModel");
const Cart = require("../models/cartModels");
const Address = require("../models/address");
const Wishlist = require("../models/wishlistModel");
const path = require("path");
const error500 = path.join(__dirname, "views", "error.html");
//==========================showwish=========================================

const showwish = async (req, res) => {
  try {
    const user = req.session.user_id;
    const cart = await Wishlist.findOne({ user: req.session.user_id });
    const wish = await Wishlist.findOne({ user: req.session.user_id });
    let cartCount = 0;
    let wishCount = 0;
    if (cart) {
      cartCount = cart.products.length;
    }
    if (wish) {
      wishCount = wish.products.length;
      const wishlist = await Wishlist.findOne({
        user: req.session.user_id,
      }).populate("products.productId");
      const products = wishlist.products;

      res.render("wishlist", {
        name: req.session.name,
        products: products,
        wishCount,
        cartCount,
        user,
      });
    } else {
      res.render("wishlist", {
        name: req.session.name,
        cartCount,
        wishCount,
        products: undefined,
        user,
      });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).sendFile(error500);
  }
};
//===========================addToWishlist==================================

const addToWishlist = async (req, res) => {
  try {
    const proId = req.body.id;
    if (req.session.user_id) {
      const already = await Wishlist.findOne({ user: req.session.user_id });
      if (already) {
        const proExist = already.products.some(
          (product) => product.productId.toString() === proId
        );
        if (!proExist) {
          await Wishlist.updateOne(
            { user: req.session.user_id },
            { $push: { products: { productId: proId } } }
          );
          res.json({ success: true });
        } else {
          res.json({ exist: true });
        }
      } else {
        const data = new Wishlist({
          user: req.session.user_id,
          products: [
            {
              productId: proId,
            },
          ],
        });
        await data.save();
        res.json({ success: true });
      }
    } else {
      res.json({ login: true });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).sendFile(error500);
  }
};

//===========================REMOVE FROM WISHLIST===================================

const removeWishItem = async (req, res) => {
  try {
    const proId = req.body.product;
    const wish = await Wishlist.findOne({ user: req.session.user_id });
    if (wish) {
      await Wishlist.findOneAndUpdate(
        { user: req.session.user_id },
        {
          $pull: { products: { productId: proId } },
        }
      );
      res.json({ remove: true });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).sendFile(error500);
  }
};

module.exports = {
  showwish,
  addToWishlist,
  removeWishItem,
};
