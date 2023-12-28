const mongoose = require("mongoose");
const { ObjectId } = require("mongodb");

const wishlistSchema = new mongoose.Schema({
  user: {
    type: String,
    required: true,
  },
  products: [
    {
      productId: {
        type: ObjectId,
        ref: "products",
        required: true,
      },
    },
  ],
});

module.exports = mongoose.model("wishlist", wishlistSchema);