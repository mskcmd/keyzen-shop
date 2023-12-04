const User = require("../models/userModel");
const Product = require("../models/productModel");
const Cart = require("../models/cartModels");
const Address = require("../models/address");
const Order = require("../models/oderModel");


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
      let totalAmount = 0
    if (cartData) {
      for (let i = 0; i < cartData.products.length; i++) {
        let cartItem = cartData.products[i];
        let productprice = cartItem.product.price;
        let productcount = cartItem.count;
        totalAmount += productcount * productprice;
      }
    } 
    // console.log(cartData);

    const Total = totalAmount;
    const name = userData.name;
    const uniNum = Math.floor(Math.random() * 900000) + 100000;
    const status = req.body.payment === "COD" ? "placed" : "pending";
    const statusLevel = status === "placed" ? 1 : 0;

    // console.log("Address:", address_details);
    // console.log("Products:", cartData.products);
    // console.log("Total Amount:", Total);

    const orderProducts = [];
    for (let i = 0; i < cartData.products.length; i++) {
      const cartProduct = cartData.products[i];
      const product = cartProduct.product;
      const count = cartProduct.count;
      const price = product.price;

      // Check if the product already exists in the orderProducts array
      const existingProduct = orderProducts.find((op) =>
        op.productId.equals(product)
      );

      if (existingProduct) {
        // If the product already exists in the order, increment the count and update the total price
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

    await order.save();

    const orderId = order._id;

    for (let i = 0; i < cartData.products.length; i++) {
      let product = cartData.products[i].product;
      let count = cartData.products[i].count;

      await Product.updateOne({ _id: product }, { $inc: { quantity: -count } });
    }
    await Cart.deleteOne({ user: userId });
    return res.json({ success: true });
   
  }else{
     res.json({ notaddress:true });

  }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//==========================================viewOrderDetails=============================================


const viewOrderDetails = async (req, res) => {
  try {
    const userid = req.session.user_id;
if(userid){
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
  }else{
    res.redirect("/login") 
  }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "Internal server error" });
  }
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
      // console.log(userId);
      const user = await User.findById(userId);
      const userName = user ? user.name : "User not found";
      // console.log(userName)
    }


  // Assuming orderData is an array of orders
orderData.forEach((order) => {
  if (order.address && Array.isArray(order.address)) {
    order.address.forEach((address) => {
      if (address && address.addressId) {
        const addressId = address.addressId;
        console.log(addressId);
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
        let  count = product.count;
        const  productPrice = product.productPrice;
        // console.log("productPrice",productPrice);
        const  totalPrice = product.totalPrice;
        console.log("totalPrice",totalPrice);
        // console.log("q", proid);
        const proname = proid.name;
        // console.log(proname);
      });
    });



    res.render("oderManage",{orders:orderData});
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

//==========================================orderFullDetails=============================================

const orderFullDetails =  async(req,res)=>{
  try {
    const id = req.query.id;
    const orderedProduct = await Order.findOne({ _id: id }).populate(
      "products.productId"
    );


    res.render("oderfullview", { orders: orderedProduct });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "Internal server error" });
  }
}


//==========================================orderCancel=============================================

const orderCancel = async (req, res) => {
  try {
    console.log(req.body);
    const orderId = req.body.orderid;
    const userId = req.session.user_id;
    const cancelReason = req.body.reason;
    console.log(cancelReason);

    const orderData = await Order.findOne({ _id: orderId });
    console.log(orderData);
    if (!orderData) {
      console.log("Order not found for cancellation");
      return res.status(404).json({ error: "Order not found" });
    }

    const products = orderData.products;

    // Check if the order is eligible for cancellation
    if (
      orderData.paymentMethod === "COD" 
     
    ) {
      // Change the order status to cancelled
      const updatedData = await Order.updateOne(
        { _id: orderId },
        {
          $set: { cancelReason: cancelReason, status: "cancelled", statusLevel: 0 },
        }
      );
 console.log(updatedData);
      if (!updatedData) {
        console.log("Order status not updated");
        return res.status(500).json({ error: "Internal server error" });
      }

      for (let i = 0; i < products.length; i++) {
        const pro = products[i].productId;
        const count = products[i].count;
        await Product.findOneAndUpdate(
          { _id: pro },
          { $inc: { quantity: count } }
        );
      }

      console.log("Order status updated to cancelled");

      return res.redirect(`/viewOrderDetails?id=${orderId}`);
    } else {
      console.log("Order is not eligible for cancellation");
      return res.status(400).json({ error: "Order is not eligible for cancellation" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

//==========================================statusUpdate=============================================

const statusUpdate = async (req, res) => {
  try {
    const orderId = req.query.id;
    const orderData = await Order.findOne({_id:orderId})
    const userId = orderData.userId    
    const statusLevel = req.query.status;
    const amount = orderData.totalAmount;
    const products = orderData.products;
    

    if(statusLevel === '0'){
      await Order.updateOne(
        { _id: orderId },
        { $set: { status: "cancelled", statusLevel: 0 } } );
      
        for (let i = 0; i < products.length; i++) {
          let pro = products[i].productId;
          let count = products[i].count;
          await Product.findOneAndUpdate(
            { _id: pro },
            { $inc: { quantity: count } }
          );
        }
        
    }
    res.redirect("/admin/orderManage");

  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

//==========================================orderSuccess=============================================

const orderSuccess = async(req,res)=>{
  try {
    const userData = await User.findById(req.session.user_id);
    if(userData){
    res.render('orderSuccess',{user:userData})
    }else{
      res.redirect("/login")
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
}
//==========================================homeOrderBtn=============================================

const homeOrderBtn = async(req,res)=>{
  try {
    res.redirect("/");    
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  placeOrder,
  viewOrderDetails,
  orderManage,
  orderFullDetails,
  orderCancel,
  statusUpdate,
  orderSuccess,
  homeOrderBtn

};
