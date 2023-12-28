const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  percentages: {
    type: Number,
    required: true,
  },
  activeDate: {
    type: Date,
    required: true,
  },
 
  expDate: {
    type: Date,
    default: 0,
  },
  blocked: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model("offer", offerSchema);
