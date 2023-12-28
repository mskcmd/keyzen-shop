const User = require("../models/userModel");
const Product = require("../models/productModel");
const Cart = require("../models/cartModels");
const Address = require("../models/address");
const Order = require("../models/oderModel");
const Offer = require("../models/offerModel");
const path = require("path");
const error500 = path.join(__dirname, "views", "error.html");
//==========================================addtocart=============================================

const addtocart = async (req, res) => {
  try {
    const user_id = req.session.user_id;
    const product_id = req.body.id;
    const count = 1;
    if (user_id) {
      const existingUser = await Cart.findOne({ user: user_id });
      if (existingUser) {
        const existingProduct = existingUser.products.find(
          (item) => item.product.toString() === product_id
        );

        const productPrice = await Product.findOne({ _id: product_id });
        const totalprice = productPrice.price;

        if (existingProduct) {
          const cartData = await Product.findOne({ _id: product_id });
          if (existingProduct.count >= cartData.quantity) {
            return res.json({ message: "stoke is deon", nostoked: true });
          }
          existingProduct.count += 1;
        } else {
          existingUser.products.push({
            product: product_id,
            count: 1,
          });
        }

        await existingUser.save();
      } else {
        const newCart = new Cart({
          user: user_id,
          products: [{ product: product_id, count }],
          createdAt: Date.now(),
        });

        await newCart.save();
      }
      return res
        .status(200)
        .json({ message: "Added to cart successfully", added: true });
    } else {
      return res.json({ message: "user not loged", noUser: true });
    }
  } catch (error) {
    console.error(error.stack || error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//==========================================cartpage=============================================

const cartpage = async (req, res) => {
  try {
    const id = req.session.user_id;
    const userData = await User.findById(id);
    const cartData = await Cart.findOne({ user: id }).populate(
      "products.product"
    );

    req.session.code = false;
    let totalAmount = 0;

    if (cartData) {
      for (let i = 0; i < cartData.products.length; i++) {
        let cartItem = cartData.products[i];

        // Check if there is a discount
        if (
          cartItem.product.discount !== null &&
          cartItem.product.discount !== undefined
        ) {
          let productprice = cartItem.product.discount;
          totalAmount += cartItem.count * productprice;
        } else {
          let productprice = cartItem.product.price;
          totalAmount += cartItem.count * productprice;
        }
      }

      res.render("addtoCart", {
        user: userData,
        cartData: cartData,
        totalAmount: totalAmount,
        id,
      });
    } else {
      res.render("addtoCart", {
        user: userData,
        cartData: null,
        totalAmount: 0,
      });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).sendFile(error500);
  }
};

//==========================================removeCartItem=============================================

const removeCartItem = async (req, res, next) => {
  try {
    const userId = req.session.user_id;
    const proId = req.body.product;
    const cartData = await Cart.findOne({ user: userId });

    if (cartData) {
      await Cart.findOneAndUpdate(
        { user: userId },
        {
          $pull: { products: { product: proId } },
        }
      );
      res.json({ success: true });
    } else {
      res.json({ success: false, message: "Cart not found" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).sendFile(error500);
  }
};

//==========================================changeCartQuantity=============================================

const changeCartQuantity = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const count = req.body.count;
    const product_id = req.body.product_id;
    const existingUser = await Cart.findOne({ user: userId });

    if (existingUser) {
      const existingProduct = existingUser.products.find(
        (item) => item.product.toString() === product_id
      );

      const product = await Product.findById(product_id);
      if (existingProduct && count <= product.quantity && count <= 10) {
        existingProduct.count = count;
        await existingUser.save();

        res.status(200).json({
          count: existingProduct.count,
          amount: product.price * existingProduct.count,
          disamount: product.discount * existingProduct.count,

          message: "Cart updated successfully",
        });
      } else {
        res.status(400).json({ message: "Cart not updeted" });
      }
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).sendFile(error500);
  }
};

//==========================================loadchekout=============================================

const loadchekout = async (req, res) => {
  try {
    const userId = req.session.user_id;
    if (userId) {
      const userCart = await Cart.findOne({ user: userId });
      if (!userCart) {
        return res.json({ message: "Your cart is empty.", cartEmpty: true });
      }

      const productData = await Product.findOne({
        _id: userCart.products[0].product,
      });

      if (userCart.products[0].count > productData.quantity) {
        return res.json({
          message: "Stock is depleted . delet your cart product",
          noStock: true,
        });
      } else {
        return res.json({ success: true });
      }
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).sendFile(error500);
  }
};

//==========================================landchekout=============================================

const landchekout = async (req, res) => {
  try {
    const user_id = req.session.user_id;
    const userData = await User.findById(user_id);
    const AddressData = await Address.find({ user: user_id });
    const orderData = await Order.find({ userId: user_id });

    const cartData = await Cart.findOne({ user: user_id }).populate(
      "products.product"
    );
    let totalAmount = 0;

    if (cartData) {
      for (let i = 0; i < cartData.products.length; i++) {
        let cartItem = cartData.products[i];

        // Check if there is a discount
        if (
          cartItem.product.discount !== null &&
          cartItem.product.discount !== undefined
        ) {
          let productprice = cartItem.product.discount;
          totalAmount += cartItem.count * productprice;
        } else {
          let productprice = cartItem.product.price;
          totalAmount += cartItem.count * productprice;
        }
      }

      if (userData) {
        res.render("chekOut", {
          user: userData,
          add: AddressData,
          cartData: cartData,
          totalAmount,
          orderData,
        });
      }
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).sendFile(error500);
  }
};

module.exports = {
  addtocart,
  cartpage,
  removeCartItem,
  changeCartQuantity,
  loadchekout,
  landchekout,
};
