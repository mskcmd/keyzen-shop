const path = require("path");
const error500 = path.join(__dirname, "views", "error.html");

const isLogin = async (req, res, next) => {
  try {
    if (req.session.admin_id) {
      next();
    } else {
      res.redirect("/admin");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const isLogout = async (req, res, next) => {
  try {
    if (req.session.admin_id) {
      res.redirect("/admin/adminhome");
    } else {
      next();
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).sendFile(error500);
  }
};

module.exports = {
  isLogin,
  isLogout,
};
