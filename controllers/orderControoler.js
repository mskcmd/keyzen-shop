const User = require("../models/userModel");
const Product = require("../models/productModel");
const Cart = require("../models/cartModels");
const Address = require("../models/address");
const Order = require("../models/oderModel");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Coupon = require("../models/couponModel");
const dotenv = require("dotenv");
dotenv.config();
const path = require("path");
const error500 = path.join(__dirname, 'views', 'error.html')
//==========================RAZORPAY INSTANCE================================

var instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
//==========================================placeOrder=============================================

const placeOrder = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const userData = await User.findOne({ _id: userId });
    const addressId = req.body.address;
    const address_details = await Address.findOne({ _id: addressId });
    const cartData = await Cart.findOne({ user: userId }).populate(
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
    }
    const Total = totalAmount;
    const name = userData.name;
    const uniNum = Math.floor(Math.random() * 900000) + 100000;
    const status = req.body.payment === "COD" ? "placed" : "pending";
    const statusLevel = status === "placed" ? 1 : 0;
    const walletBalance = userData.wallet;
    const orderProducts = [];
    const code = req.body.code;
    // await Coupon.updateOne({couponCode:code},{$inc:{usersLimit: -1 }})
    // await Coupon.updateOne({couponCode:code},{$push:{usedUsers:req.session.user_id}})

    for (let i = 0; i < cartData.products.length; i++) {
      const cartProduct = cartData.products[i];
      const product = cartProduct.product;
      const count = cartProduct.count;
      const price = product.price;

      const existingProduct = orderProducts.find((op) =>
        op.productId.equals(product)
      );

      if (existingProduct) {
        existingProduct.count += count;
        existingProduct.productPrice = price;
        existingProduct.totalPrice += count * price;
      } else {
        // If the product doesn't exist in the order, add it to orderProducts with total price
        orderProducts.push({
          productId: product,
          count,
          productPrice: price,
          totalPrice: count * price,
        });
      }
    }

    if (address_details) {
      const order = new Order({
        uniqueId: uniNum,
        userId: userId,
        userName: name,
        paymentMethod: req.body.payment,
        products: orderProducts,
        address: address_details,
        address: {
          addressId: address_details._id,
          name: address_details.name,
          mobile: address_details.mobile,
          email: address_details.email,
          houseName: address_details.houseName,
          city: address_details.city,
          state: address_details.state,
          pin: address_details.pin,
        },
        totalAmount: Total,
        date: new Date(),
        status: status,
        statusLevel: statusLevel,
      });

      const orderData = await order.save();
      const orderId = order._id;

      if (orderData) {
        if (order.status === "placed") {
          for (let i = 0; i < cartData.products.length; i++) {
            let product = cartData.products[i].product;
            let count = cartData.products[i].count;

            await Product.updateOne(
              { _id: product },
              { $inc: { quantity: -count } }
            );
          }
          if (req.session.code) {
            const coupon = await Coupon.findOne({
              couponCode: req.session.code,
            });
            req.session.code = false;
            const disAmount = coupon.discountAmount;
            await Order.updateOne(
              { _id: orderId },
              { $set: { discount: disAmount } }
            );
            const totel = Total - disAmount;
            coupon.usedUsers.push(req.session.user_id);
            const copuen =   await coupon.save();
            await Order.updateOne(
              { _id: orderId },
              { $set: { totalAmount: totel } }
            );
            if(copuen){
              await Order.updateOne(
                { userId: req.session.user_id },
                { $set: { applied: "applied" } }
              );
            }
            req.session.success=true
            await Cart.deleteOne({ user: userId });
            return res.json({ success: true, orderId });
          }
          req.session.success=true
          await Cart.deleteOne({ user: userId });
          return res.json({ success: true, orderId });
        } else {
          const orderId = orderData._id;
          const totalAmount = orderData.totalAmount;
          if (order.paymentMethod == "onlinePayment") {
            if (req.session.code) {
              const coupon1 = await Coupon.findOne({
                couponCode: req.session.code,
              });
              const disAmount = coupon1.discountAmount;
              const disAmount4 = totalAmount - disAmount;
            
              if (coupon1) {
                var options = {
                  amount: disAmount4 * 100,
                  currency: "INR",
                  receipt: "" + orderId,
                };
              } else {
                var options = {
                  amount: totalAmount * 100,
                  currency: "INR",
                  receipt: "" + orderId,
                };
              }
            } else {
             
              var options = {
                amount: totalAmount * 100,
                currency: "INR",
                receipt: "" + orderId,
              };
            }
            
            const order = instance.orders.create(
              options,
              function (err, order) {
                res.json({ order });
              }
            );
          } else if (order.paymentMethod == "wallet") {
            if (walletBalance >= Total) {
              const result = await User.updateOne(
                { _id: userId },
                {
                  $inc: { wallet: -Total },
                  $push: {
                    walletHistory: {
                      date: new Date(),
                      amount: Total,
                      reason: "Purchased Amount Debited.",
                      cancelOderId:uniNum

                    },
                  },
                },
                { new: true }
              );
              await Order.findByIdAndUpdate(
                orderId,
                { status: "placed", statusLevel: 1 },
                { new: true }
              );

              if (result) {
                console.log("amount debited from wallet");
              } else {
                console.log("not debited from wallet");
              }
              for (let i = 0; i < cartData.products.length; i++) {
                let product = cartData.products[i].product;
                let count = cartData.products[i].count;

                await Product.updateOne(
                  { _id: product },
                  { $inc: { quantity: -count } }
                );
              }

              if (req.session.code) {
                const coupon = await Coupon.findOne({
                  couponCode: req.session.code,
                });
                req.session.code = false;
                const disAmount = coupon.discountAmount;
                await Order.updateOne(
                  { _id: orderId },
                  { $set: { discount: disAmount } }
                );
                const totel = Total - disAmount;
                coupon.usedUsers.push(req.session.user_id);
                const copuen= await coupon.save();
                await Order.updateOne(
                  { _id: orderId },
                  { $set: { totalAmount: totel } }
                );
                if(copuen){
                  await Order.updateOne(
                    { userId: req.session.user_id },
                    { $set: { applied: "applied" } }
                  );
                }
                req.session.success=true
                await Cart.deleteOne({ user: userId });
                return res.json({ success: true, orderId });
              }

              await Cart.deleteOne({ user: userId });
              req.session.success=true
              return res.json({ success: true });
            } else {
              console.log("false");
              res.json({ walletFailed: true });
            }
          }
        }
      }
    } else {
      res.json({ notaddress: true });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
//=================================verifyPeyment=====================================
const verifyPayment = async (req, res) => {
  try {
    const userId = req.session.user_id;
    let orderId = req.body.order.receipt;
    const cartData = await Cart.findOne({ user: userId }).populate(
      "products.product"
    );
    const products = cartData.products;

    const details = req.body;

    const hmac = crypto.createHmac("sha256", "YgtIcUty8k3ACrcGRnadqtK4");
    const dataToHash =
      details.payment.razorpay_order_id +
      "|" +
      details.payment.razorpay_payment_id;
    hmac.update(dataToHash);
    const hmacValue = hmac.digest("hex");

    if (hmacValue == details.payment.razorpay_signature) {
      for (let i = 0; i < cartData.products.length; i++) {
        let product = cartData.products[i].product;
        let count = cartData.products[i].count;

        await Product.updateOne(
          { _id: product },
          { $inc: { quantity: -count } }
        );
      }
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
      }
      const Total = totalAmount;
      if (req.session.code) {
        const coupon = await Coupon.findOne({ couponCode: req.session.code });
        req.session.code = false;
        const disAmount = coupon.discountAmount;
        const orderDetails = await Order.findOne({ _id: orderId });
        orderId = orderDetails._id;
        await Order.updateOne(
          { _id: orderId },
          { $set: { discount: disAmount } }
        );
        const totel = Total - disAmount;
        coupon.usedUsers.push(req.session.user_id);
       const copuen= await coupon.save();
      
        await Order.updateOne(
          { _id: orderId },
          { $set: { totalAmount: totel } }
        );
        if(copuen){
          await Order.updateOne(
            { userId: req.session.user_id },
            { $set: { applied: "applied" } }
          );
        }
       
        const orderUpdate = await Order.findByIdAndUpdate(
          { _id: details.order.receipt },
          {
            $set: {
              status: "placed",
              statusLevel: 1,
              paymentId: details.payment.razorpay_payment_id,
            },
          }
        );

        const cartDeletion = await Cart.deleteOne({ user: userId });

        const orderid = details.order.receipt;
        req.session.success=true
        await Cart.deleteOne({ user: userId });
        return res.json({ codsuccess: true, orderId });
      }
      const orderUpdate = await Order.findByIdAndUpdate(
        { _id: details.order.receipt },
        {
          $set: {
            status: "placed",
            statusLevel: 1,
            paymentId: details.payment.razorpay_payment_id,
          },
        }
      );
      req.session.success=true
      const cartDeletion = await Cart.deleteOne({ user: userId });
      const orderid = details.order.receipt;
      res.json({ codsuccess: true, orderid });
    } else {
      await Order.findByIdAndDelete(details.order.receipt);

      res.json({ success: false });
    }
  } catch (error) {
    console.error(error.message);
res.status(500).sendFile(error500)  }
};

//==========================================viewOrderDetails=============================================

const viewOrderDetails = async (req, res) => {
  try {
    const userid = req.session.user_id;
    if (userid) {
      const user = req.session.user_id;
      const id = req.query.id;
      const orderedProduct = await Order.findOne({ _id: id }).populate(
        "products.productId"
      );
      const currentDate = new Date();
      const deliveryDate = orderedProduct.deliveryDate;
      const timeDiff = currentDate - deliveryDate;
      const daysDiff = Math.floor(timeDiff / (24 * 60 * 60 * 1000));
      res.render("oderDetails", {
        user,
        orders: orderedProduct,
        daysDiff: daysDiff,
      });
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error.message);
res.status(500).sendFile(error500)  }
};

//==========================================orderManage=============================================

const orderManage = async (req, res) => {
  try {
    const user = req.session.user_id;
    const orderData = await Order.find({})
      .sort({ date: -1 })
      .populate("products.productId");

    for (const order of orderData) {
      const userId = order.userId;
      const user = await User.findById(userId);
      const userName = user ? user.name : "User not found";
    }

    // Assuming orderData is an array of orders
    orderData.forEach((order) => {
      if (order.address && Array.isArray(order.address)) {
        order.address.forEach((address) => {
          if (address && address.addressId) {
            const addressId = address.addressId;
          } else {
            console.log("Invalid address structure in order:", order);
          }
        });
      } else {
        console.log("Invalid address array in order:", order);
      }
    });
    orderData.forEach((order) => {
      order.products.forEach((product) => {
        let proid = product.productId;
        let count = product.count;
        const productPrice = product.productPrice;
        // Check if proid is not null or undefined before accessing its name property
        const proname = proid ? proid.name : "Product not found";
      });
    });

    res.render("oderManage", { orders: orderData });
  } catch (error) {
    console.log(error.message);
res.status(500).sendFile(error500)  }
};

//==========================================orderFullDetails=============================================

const orderFullDetails = async (req, res) => {
  try {
    const id = req.query.id;
    const orderedProduct = await Order.findOne({ _id: id }).populate(
      "products.productId"
    );

    res.render("oderfullview", { orders: orderedProduct });
  } catch (error) {
    console.log(error.message);
res.status(500).sendFile(error500)  }
};

//==========================================orderCancel=============================================

const orderCancel = async (req, res) => {
  try {
    const orderId = req.body.orderid;
    const Id = req.session.user_id;
    const cancelReason = req.body.reason;
    const cancelAmount = req.body.totalPrice;
    const amount = parseInt(cancelAmount);
    const orderData = await Order.findOne({ _id: orderId });
    const oid=orderData.uniqueId
    const products = orderData.products;

    if (orderData.paymentMethod != "COD" && orderData.status != "pending") {
      const refundOption = "" + req.body.refundOption;

      if (refundOption === "Wallet") {
        const user = await User.findById(Id);
        const result = await User.findOneAndUpdate(
          { _id: Id },
          {
            $inc: { wallet: amount },
            $push: {
              walletHistory: {
                date: new Date(),
                amount: amount,
                reason: "Cancelled Product Amount Credited",
                cancelOderId:oid,

              },
            },
          },
          { new: true }
        );

        if (result) {
          console.log(`Added ${amount} to the wallet.`);
        } else {
          console.log("User not found.");
        }
        const updatedData = await Order.updateOne(
          { _id: orderId },
          {
            $set: {
              cancelReason: cancelReason,
              status: "cancelled",
              statusLevel: 0,
            },
          }
        );

        for (let i = 0; i < products.length; i++) {
          let pro = products[i].productId;
          let count = products[i].count;
          await Product.findOneAndUpdate(
            { _id: pro },
            { $inc: { quantity: count } }
          );
        }

        if (updatedData) {
          console.log("order status updated to cancel");
        } else {
          console.log("order status not updated");
        }
        console.log("User wallet updated successfully.");
        return res.redirect(`/viewOrderDetails?id=${orderId}`);
      } else {
        // Refund to user bank account
        console.log("refund to bank acc not added");
      }

      res.redirect("/orders");
    } else if (
      orderData.paymentMethod == "COD" ||
      orderData.status == "pending"
    ) {
      // Change the order status
      const updatedData = await Order.updateOne(
        { _id: orderId },
        {
          $set: {
            cancelReason: cancelReason,
            status: "cancelled",
            statusLevel: 0,
          },
        }
      );

      for (let i = 0; i < products.length; i++) {
        const pro = products[i].productId;
        const count = products[i].count;
        await Product.findOneAndUpdate(
          { _id: pro },
          { $inc: { quantity: count } }
        );
      }

      if (updatedData) {
        return res.redirect(`/viewOrderDetails?id=${orderId}`);
      } else {
        console.log("order status not updated");
      }
    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

//==========================================statusUpdate=============================================

const statusUpdate = async (req, res) => {
  try {
    const orderId = req.query.id;
    const orderData = await Order.findOne({ _id: orderId });
    const userId = orderData.userId;
    const statusLevel = req.query.status;
    const amount = orderData.totalAmount;
    const products = orderData.products;

    if (statusLevel === "0") {
      await Order.updateOne(
        { _id: orderId },
        { $set: { status: "cancelled", statusLevel: 0 } }
      );

      for (let i = 0; i < products.length; i++) {
        let pro = products[i].productId;
        let count = products[i].count;
        await Product.findOneAndUpdate(
          { _id: pro },
          { $inc: { quantity: count } }
        );
      }
    } else if (statusLevel === "2") {
      await Order.updateOne(
        { _id: orderId },
        { $set: { status: "shipped", statusLevel: 2 } }
      );
    } else if (statusLevel === "3") {
      await Order.updateOne(
        { _id: orderId },
        {
          $set: {
            status: "delivered",
            deliveryDate: new Date(),
            statusLevel: 3,
          },
        }
      );
    }
    res.redirect("/admin/orderManage");
  } catch (error) {
    console.log(error.message);
res.status(500).sendFile(error500)  }
};

//==========================================orderSuccess=============================================

const orderSuccess = async (req, res) => {
  try {
    const userData = await User.findById(req.session.user_id);
    if (userData) {
      if (req.session.success) {
        res.render("orderSuccess", { user: userData });
        req.session.success = false;
      } else {
        res.redirect("/");
      }
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).sendFile(error500);
  }
};


//==========================================homeOrderBtn=============================================

const homeOrderBtn = async (req, res) => {
  try {
    res.redirect("/");
  } catch (error) {
    console.log(error.message);
res.status(500).sendFile(error500)  }
};
//=================================orderReturn=====================================

const orderReturn = async (req, res) => {
  try {
    const orderId = req.body.orderid;
    const returnReason = req.body.reason;
    const returnAmount = req.body.totalPrice;
    const amount = parseInt(returnAmount);
    const orderData = await Order.findOne({ _id: orderId });
    const oid=orderData.uniqueId
    const products = orderData.products;
    const result = await User.findOneAndUpdate(
      { _id: req.session.user_id },
      {
        $inc: { wallet: amount },
        $push: {
          walletHistory: {
            date: new Date(),
            amount: amount,
            reason: "Returned Product Amount Credited.",
            cancelOderId:oid
          },
        },
      },
      { new: true }
    );
    if (result) {
      const updatedData = await Order.updateOne(
        { _id: orderId },
        {
          $set: {
            returnReason: returnReason,
            status: "Returned",
            statusLevel: 0,
          },
        }
      );
      if (updatedData) {
        for (let i = 0; i < products.length; i++) {
          let pro = products[i].productId;
          let count = products[i].count;
          await Product.findOneAndUpdate(
            { _id: pro },
            { $inc: { quantity: count } }
          );
        }
        return res.redirect(`/viewOrderDetails?id=${orderId}`);
      } else {
        console.log("order not updated");
      }
    } else {
      console.log("user not found");
    }
  } catch (error) {
    console.log(error.message);
res.status(500).sendFile(error500)  }
};

const orderInvoice = async (req, res) => {
  try {
    const id = req.params.id;
    const user = req.session.user_id;
    const userData = await User.findOne({ _id: user });
    const orderData = await Order.findOne({ _id: id }).populate(
      "products.productId"
    );
    const date = new Date();
    data = {
      order: orderData,
      user: userData,
      date,
    };
    res.render("invoice", { order: orderData, user: userData, date });
  } catch (error) {
    console.log(error.message);
res.status(500).sendFile(error500)  }
};

module.exports = {
  placeOrder,
  viewOrderDetails,
  orderManage,
  orderFullDetails,
  orderCancel,
  statusUpdate,
  orderSuccess,
  homeOrderBtn,
  verifyPayment,
  orderReturn,
  orderInvoice,
};
