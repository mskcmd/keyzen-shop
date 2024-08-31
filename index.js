require('dotenv').config();
const mongoDB = require('./config/mongoAuth')
mongoDB.mongoDB()
const session = require("express-session");
const express = require("express");
const bodyParser = require('body-parser');
const path = require("path");
const app = express();
const crypto = require("crypto");
const secretKey = crypto.randomBytes(32).toString("hex");
const nocache = require("nocache");
require('dotenv').config();


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

//Error Handle 
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "views", "404.html"));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).sendFile(path.join(__dirname, 'views', 'error.html'));
});


app.listen(3000, function () {
  console.log(`Server is running on http://localhost:${3000}`);
});
   