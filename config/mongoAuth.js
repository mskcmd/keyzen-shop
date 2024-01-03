const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  mongoDB: () => {
    mongoose
      .connect(process.env.Mongo_url)
      .then(() => {
        console.log("(Atlas) MongoDB Database connected");
      })
      .catch((err) => {
        console.error("Error connecting to MongoDB:", err.message);
      });
  },
};
