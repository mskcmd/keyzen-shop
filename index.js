const mongoose = require("mongoose");
mongoose.connect("mongodb://127.0.0.1:27017/keyzen");
const session = require("express-session");
const express = require("express");
const bodyParser = require('body-parser');
const path = require("path");
const app = express();
const db = mongoose.connection;
const crypto = require("crypto");
const secretKey = crypto.randomBytes(32).toString("hex");
const nocache = require("nocache");

db.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

db.once("open", () => {
  console.log("Connected to MongoDB");
});

app.use(nocache());

// app.use(bodyParser.urlencoded({ extended: false }));
// app.use(bodyParser.json());

const userRoute = require("./routes/userRoute");
const adminRoute = require("./routes/adminRoute");

app.use(
  session({
    secret: secretKey,
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 48 * 60 * 60 * 1000, // 24 hours in milliseconds
    },
  })
);
app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");
app.set("views", "./views");

//=====================for User Routes===================
app.use("/", userRoute);

//=====================for admin Routes===================

app.use("/admin", adminRoute);

app.listen(3000, function () {
  console.log(`Server is running on http://localhost:${3000}`);
});
