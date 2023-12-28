const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  blocked: {
    type: Number,
    default: 0,
  },
  offer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "offer", 
    default: null,
  },
  catediscount: {
    type: Number,
    default: null,
  }
});

module.exports = mongoose.model("category", categorySchema);
