const isLogin = async (req, res, next) => {
  try {
    if (req.session.admin_id) {
      next();
    } else {
      res.redirect("/admin");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'Internal server error' });  }
};

const isLogout = async (req, res, next) => {
  try {
    if (req.session.admin_id) {
      res.render("dashbord");
    } else {
      next();
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'Internal server error' });  }
};

module.exports = {
  isLogin,
  isLogout,
};
