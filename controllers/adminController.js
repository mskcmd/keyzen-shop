const User = require("../models/userModel");
const Cate = require("../models/category");

const bcrypt = require("bcrypt");

//==============================securePassword===============================

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
    throw error;
  }
};
//==============================loginload===================================
const loadlogin = async (req, res) => {
  try {
    res.render("adminlogin");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};
//==============================loginadmin===================================

// Define admin credentials
const loginadmin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const adminData = await User.findOne({ email: email });

    if (adminData) {
      const passwordMatch = await bcrypt.compare(password, adminData.password);
      if (passwordMatch) {
        if (adminData.is_admin === true) {
          req.session.admin_id = adminData._id;
          res.redirect("/admin/adminhome");
        } else {
          res.render("adminlogin", {
            message: "You are not authorized as an admin.",
          });
        }
      } else {
        res.render("adminlogin", { message: "Password is incorrect." });
      }
    } else {
      res.render("adminlogin", { message: "Email is incorrect." });
    }
  } catch (error) {
    console.log(error.message);
  }
};

//==============================dashbord===================================

const dashbord = async (req, res) => {
  try {
    if (req.session.admin_id) {
      res.render("dashbord");
    } else {
      res.render("adminlogin", {
        message: "You are not authorized. Please log in as an admin.",
      });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'Internal server error' });  }
};
//==============================userLogout===================================

const adminLogout = async (req, res) => {
  try {
    req.session.admin_id = null;
    res.redirect("/admin/");
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
};

//==============================showuser===================================
const showuser = async (req, res) => {
  try {
    const usersData = await User.find({ is_admin: false });
    res.render("userdatas", { users: usersData });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'Internal server error' });  }
};
//==============================user = un=blockuser===================================

const userunblock = async (req, res) => {
  try {
    const udpatedata = await User.findOne({ _id: req.query.id });
    if (udpatedata.is_verified == 0) {
      await User.updateOne({ _id: req.query.id }, { $set: { is_verified: 1 } });
      res.redirect("/admin/userdata");
    } else {
      await User.updateOne({ _id: req.query.id }, { $set: { is_verified: 0 } });
      res.redirect("/admin/userdata");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

//=============================cate = un=blockuser===================================

const unandblock = async (req, res) => {
  try {
    const blockedCat = await Cate.findOne({ _id: req.query.id });
    if (blockedCat.blocked == 0) {
      await Cate.updateOne({ _id: req.query.id }, { $set: { blocked: 1 } });
      res.redirect("/admin/category");
    } else {
      await Cate.updateOne({ _id: req.query.id }, { $set: { blocked: 0 } });
      res.redirect("/admin/category");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const cateuppage = async (req, res) => {
  try {
    const id = req.query.id;
    const cateData = await Cate.findById({ _id: id });
    if (cateData) {
      res.render("categoryupdate", { cate: cateData });
    } else {
      res.redirect("/admin/category");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'Internal server error' });  }
};

//==============================edituser===================================

const edituser = async (req, res) => {
  try {
    const id = req.query.id;
    const userData = await User.findById({ _id: id });
    if (userData) {
      res.render("useredit", { user: userData });
    } else {
      res.redirect("/admin/userdata");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'Internal server error' });  }
};
//==============================updateuser===================================

const updateuser = async (req, res) => {
  try {
    const userData = await User.findByIdAndUpdate(
      { _id: req.body.id },
      {
        $set: {
          name: req.body.name,
          email: req.body.email,
          mobile: req.body.mobile,
        },
      }
    );
    res.redirect("/admin/userdata");
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'Internal server error' });  }
};

//==============================deletuser===================================

const deletuser = async (req, res) => {
  try {
    const id = req.query.id;
    await User.deleteOne({ _id: id });
    res.redirect("/admin/userdata");
  } catch (error) {
    console.log(error.message);
  }
};

const cateDelete = async (req, res) => {
  try {
    const id = req.query.id;
    await Cate.deleteOne({ _id: id });
    res.redirect("/admin/category");
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'Internal server error' });  }
};

//==============================adduser===================================

const adduser = async (req, res) => {
  try {
    res.render("adduser");
  } catch (error) {
    console.log(error.message);
  }
};
//==============================addtouser===================================

const addtouser = async (req, res) => {
  try {
    console.log(req.bod);
    const spassword = await securePassword(req.body.password);
    const newUser = new User({
      name: req.body.name,
      email: req.body.email,
      mobile: req.body.mobile,
      password: spassword,
      is_admin: 0,
      is_varified: 0,
    });

    const userData = await newUser.save();
    res.redirect("/admin/userdata");
  } catch (error) {
    console.log(error.message);
  }
};

//==============================category===================================

const category = async (req, res) => {
  try {
    const cateData = await Cate.find({});
    res.render("category", { cate: cateData });
  } catch (error) {
    console.log(error.message);
  }
};
//==============================addCategory===================================

const addCategory = async (req, res) => {
  try {
    res.render("addCategory");
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'Internal server error' });  }
};

//==============================addCate===================================

const addCate = async (req, res) => {
  try {
    const name = req.body.name;
    const data = new Cate({
      name: req.body.name,
    });
    const already = await Cate.findOne({
      name: { $regex: name, $options: "i" },
    });
    if (already) {
      res.render("addCategory", {
        message: "Entered category is already exist",
      });
    } else {
      const catData = await data.save();
      res.redirect("/admin/category");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'Internal server error' });  }
};
//==============================editCate===================================

const editCate = async (req, res) => {
  try {
    const name = req.body.name;
    const data = new Cate({
      name: req.body.name,
    });
    // const already = await Cate.findOne({
    //   name: { $regex: name, $options: "i" },
    // });
    // if (already) {
      // res.render("addCategory", {
      //   message: "Entered category is already exist",
      // });
    // } else {
      const userData = await Cate.findByIdAndUpdate(
        { _id: req.body.id },
        {
          $set: {
            name: req.body.name,
          },
        }
      );
      res.redirect("/admin/category");
    // }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'Internal server error' });  }
};




module.exports = {
  loadlogin,
  loginadmin,
  dashbord,
  adminLogout,
  showuser,
  // blockuser,
  // unblockuser,
  userunblock,
  edituser,
  updateuser,
  deletuser,
  adduser,
  addtouser,
  category,
  addCategory,
  addCate,
  unandblock,
  cateDelete,
  cateuppage,
  editCate,
};
