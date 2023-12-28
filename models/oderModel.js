const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Types.ObjectId,
    ref: "User", // Reference to User model
  },
  uniqueId: {
    type: Number,
  },
  userId: {
    type: String,
  },
  userName: {
    type: String,
  },
  products: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "products",
      },
      count: {
        type: Number,
        default: 1,
      },
      productPrice: {
        type: Number,
      },
      totalPrice: {
        type: Number,
      },
    },
  ],

  address: [
    {
      addressId: {
        type: mongoose.Types.ObjectId,
        ref: "address", // Reference to Product model
      },

      name: {
        type: String,
      },
      mobile: {
        type: Number,
      },
      email: {
        type: String,
      },
      houseName: {
        type: String,
      },
      city: {
        type: String,
      },
      state: {
        type: String,
      },
      pin: {
        type: String,
      },
    },
  ],
  deliveryDate: {
    type: Date,
    
  },
  cancelReason: {
    type: String,
  },
  returnReason: {
    type: String,
  },
  totalAmount: {
    type: Number,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
  },
  statusLevel: {
    type: Number,
    default: 0,
  },
  paymentMethod: {
    type: String,
  },
  orderId: {
    type: String,
  },
  paymentId: {
    type: String,
  },
  discount: {
    type: Number,
    default: null

  },
  applied:{
    type: String,
  },
});

module.exports = mongoose.model("Order", orderSchema);
