const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  images: {
    image1:{
      type:String,
      required:true
    },
    image2:{
      type:String,
      required:true
    }
    ,image3:{
      type:String,
      required:true
    }
    ,image4:{
      type:String,
      required:true
    }
  },
  quantity: {
    type: Number,
    default: 0,
  },

  blocked: {
    type: Number,
    default: 0,
  },
  price: {
    type: Number,
    default: 0,
  },
  description: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("product", productSchema);