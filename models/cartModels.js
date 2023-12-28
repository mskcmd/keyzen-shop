const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user", // Change this to 'User'
  },

  products: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "products",
      },
      count: {
        type: Number,
        default: 1,
      },
    },
  ],
  createdAt: {
    type: Number,
    required: true,
  },
});

module.exports = mongoose.model("cart", cartSchema);
