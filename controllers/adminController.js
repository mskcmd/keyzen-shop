const User = require("../models/userModel");
const Cate = require("../models/category");
const productdata = require("../models/productModel");
const bcrypt = require("bcrypt");
const Offer = require("../models/offerModel");
const Order = require("../models/oderModel");
const fs = require("fs");
const path = require("path");
const ejs = require("ejs");
const PDFDocument = require("pdfkit");
const zip = require("express-zip");
const ExcelJS = require("exceljs");
const moment = require("moment");
const error500 = path.join(__dirname, 'views', 'error.html')

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
    res.status(500).sendFile(error500)
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
      const users = await User.find({ is_verified: 0, is_admin: false });
      const totalUser = users.length;

      const products = await productdata.find({ blocked: 0 });
      const totalOrder = await Order.find();
      const sales = await Order.countDocuments({ status: "delivered" });
      const orderData = await Order.find({})
        .sort({ date: -1 })
        .populate("products.productId");

      const codCount = await Order.countDocuments({
        status: "delivered",
        paymentMethod: "COD",
      });
      const onlinePaymentCount = await Order.countDocuments({
        status: "delivered",
        paymentMethod: "onlinePayment",
      });
      const walletCount = await Order.countDocuments({
        status: "delivered",
        paymentMethod: "wallet",
      });

      const monthlyOrderCounts = await Order.aggregate([
        {
          $match: {
            status: "delivered",
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%m",
                date: "$deliveryDate",
              },
            },
            count: { $sum: 1 },
          },
        },
      ]);

      let data = [];

      if (monthlyOrderCounts.length !== 0) {
        let ind = 0;

        for (let i = 0; i < 12; i++) {
          if (i + 1 < parseInt(monthlyOrderCounts[0]._id)) {
            data.push(0);
          } else {
            if (monthlyOrderCounts[ind]) {
              let count = monthlyOrderCounts[ind].count;
              data.push(count);
            } else {
              data.push(0);
            }
            ind++;
          }
        }
      } else {
        data = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      }

      const monthRevenue = await Order.aggregate([
        {
          $match: {
            status: "delivered",
          },
        },
        {
          $project: {
            year: { $year: "$deliveryDate" },
            month: { $month: "$deliveryDate" },
            totalAmount: 1,
          },
        },
        {
          $group: {
            _id: { year: "$year", month: "$month" },
            totalRevenue: { $sum: "$totalAmount" },
          },
        },
        {
          $sort: {
            "_id.year": 1,
            "_id.month": 1,
          },
        },
      ]);

      // Find the latest entry in monthRevenue
      const latestMonthEntry =
        monthRevenue.length !== 0
          ? monthRevenue[monthRevenue.length - 1]
          : null;

      // Get total revenue for the latest month, or set to 0 if no data
      const monRev = latestMonthEntry ? latestMonthEntry.totalRevenue : 0;

      const totalRev = await Order.aggregate([
        {
          $match: {
            status: "delivered",
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$totalAmount" },
          },
        },
      ]);

      const totalRevenue = totalRev.length !== 0 ? totalRev[0].totalRevenue : 0;

      let totalCod = await Order.aggregate([
        { $match: { status: "Delivered", paymentMethod: "COD" } },

        { $group: { _id: null, total1: { $sum: 1 } } },
      ]);

      let totalOnline = await Order.aggregate([
        { $match: { status: "Delivered", paymentMethod: "onlinePayment" } },

        { $group: { _id: null, total2: { $sum: 1 } } },
      ]);

      let totalWallet = await Order.aggregate([
        { $match: { status: "Delivered", paymentMethod: "wallet" } },

        { $group: { _id: null, total3: { $sum: 1 } } },
      ]);

      totalCod = totalCod.length > 0 ? totalCod[0].total1 : 0;
      totalOnline = totalOnline.length > 0 ? totalOnline[0].total2 : 0;
      totalWallet = totalWallet.length > 0 ? totalWallet[0].total3 : 0;

      res.render("dashbord", {
        totalUser,
        products,
        totalOrder,
        totalRevenue,
        monRev,
        sales,
        codCount,
        walletCount,
        onlinePaymentCount,
        data,
        orderData,
        totalOnline,
        totalCod,
        totalWallet,
      });
    } else {
      res.render("adminlogin", {
        message: "You are not authorized. Please log in as an admin.",
      });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).sendFile(error500)  }
};

//===================weeksalesreport=======================================

const weeklySalesDataEndpoint = async (req, res) => {
  try {
    // Fetch weekly sales data from your database or any other source
    const weeklySalesData = await Order.aggregate([
      {
        $match: {
          status: "delivered",
          // Add any other filters based on your schema
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%U",
              date: "$deliveryDate",
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);

    const labels = weeklySalesData.map((item) => `Week ${item._id}`);
    const salesData = weeklySalesData.map((item) => item.count);

    // Send the formatted data as JSON response
    res.json({ labels, salesData });
  } catch (error) {
    console.error("Error fetching weekly sales data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

//==============================userLogout===================================

const adminLogout = async (req, res) => {
  try {
    req.session.admin_id = null;
    res.redirect("/admin/");
  } catch (error) {
    console.error(error.message);
    res.status(500).sendFile(error500)
  }
};

//==============================showuser===================================
const showuser = async (req, res) => {
  try {
    const usersData = await User.find({ is_admin: false });
    res.render("userdatas", { users: usersData });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "Internal server error" });
  }
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
      const objectIdAsString = req.query.id;
      const productsInCategory = await productdata.findOne({
        category: objectIdAsString,
      });
      const cid = productsInCategory.category;
      if (cid === objectIdAsString) {
        const uodate = await productdata.updateMany(
          { category: objectIdAsString },
          { $set: { blocked: 1 } }
        );
      }
      res.json({ success: true });
    } else {
      await Cate.updateOne({ _id: req.query.id }, { $set: { blocked: 0 } });
      const objectIdAsString = req.query.id;
      const productsInCategory = await productdata.findOne({
        category: objectIdAsString,
      });

      const cid = productsInCategory.category;
      if (cid === objectIdAsString) {
        const uodate = await productdata.updateOne(
          { category: objectIdAsString },
          { $set: { blocked: 0 } }
        );
      }
      res.json({ success: true });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

//==============================cateuppage===================================

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
    res.status(500).json({ error: "Internal server error" });
  }
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
    res.status(500).json({ error: "Internal server error" });
  }
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
    res.status(500).json({ error: "Internal server error" });
  }
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
//==============================cateDelete===================================

const cateDelete = async (req, res) => {
  try {
    const id = req.query.id;
    await Cate.deleteOne({ _id: id });
    res.redirect("/admin/category");
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "Internal server error" });
  }
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
    const offer = await Offer.find({});
    var page = 1;
    var limit = 5;
    if (req.query.page) {
      page = req.query.page;
    }

    // Fix: Apply limit directly to the query, not after exec
    const cateData = await Cate.find({})
      .limit(limit)
      .skip((page - 1) * limit)
      .populate("offer") // Move populate to the correct position
      .exec();

    const count = await Cate.find({}).countDocuments();
    const totalPages = Math.ceil(count / limit);
    res.render("category", {
      cate: cateData,
      offer,
      currentPage: page,
      totalPages: totalPages,
    });
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
    res.status(500).json({ error: "Internal server error" });
  }
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
    res.status(500).json({ error: "Internal server error" });
  }
};
//==============================editCate===================================

const editCate = async (req, res) => {
  try {
    const name = req.body.name;
    const id = req.body.id;


    const already = await Cate.findOne({ name: name });

    if (!already) {
      const userData = await Cate.updateOne(
        { _id: id },
        {
          $set: {
            name: name,
          },
        }
      );

      res.redirect("/admin/category");
    } else {
      res.render("addCategory", { message: "Name already exists." });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

//==========================SALES REPORT IN ADMIN SIDE===============================

const salesReport = async (req, res) => {
  try {
    const users = await User.find({ is_block: 0 });

    const orderData = await Order.aggregate([
      { $unwind: "$products" },
      { $match: { status: "delivered" } },
      { $sort: { date: -1 } },
      {
        $lookup: {
          from: "products",
          let: { productId: { $toObjectId: "$products.productId" } },
          pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$productId"] } } }],
          as: "products.productDetails",
        },
      },
      {
        $addFields: {
          "products.productDetails": {
            $arrayElemAt: ["$products.productDetails", 0],
          },
        },
      },
    ]);

    res.render("salesReport", {
      orders: orderData,
      users,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
//=====================SALES REPORT SORTING BY YEARLY MONTHLY ETC================

const saleSorting = async (req, res) => {
  try {
    const duration = parseInt(req.params.id);
    const fromDate = req.query.fromDate;
    const toDate = req.query.toDate;

    // Check if custom date range is provided
    let startDate, endDate;
    if (fromDate && toDate) {
      startDate = new Date(fromDate);
      endDate = new Date(toDate);
    } else {
      // Calculate start date based on duration if custom date range is not provided
      const currentDate = new Date();
      startDate = new Date(currentDate - duration * 24 * 60 * 60 * 1000);
      endDate = currentDate;
    }

    const orders = await Order.aggregate([
      {
        $unwind: "$products",
      },
      {
        $match: {
          status: "delivered",
          deliveryDate: { $gte: startDate, $lt: endDate },
        },
      },
      {
        $sort: { deliveryDate: -1 },
      },
      {
        $lookup: {
          from: "products",
          let: { productId: { $toObjectId: "$products.productId" } },
          pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$productId"] } } }],
          as: "products.productDetails",
        },
      },
      {
        $addFields: {
          "products.productDetails": {
            $arrayElemAt: ["$products.productDetails", 0],
          },
        },
      },
    ]);

    res.render("salesReport", { orders });
  } catch (error) {
    console.log(error.message);
    res.status(500).sendFile(error500)
  }
};

//===========================DOWNLOAD SALES REPORT PDF AND EXCEL=================

const downloadReport = async (req, res) => {
  try {
    const format = req.query.format;

    const fromDate = req.query.fromDate;
    const toDate = req.query.toDate;


    let startDate, endDate;

    // If 'fromDate' and 'toDate' are provided, use them to define the date range
    if (fromDate && toDate) {
      startDate = new Date(fromDate);
      endDate = new Date(toDate);
    } else {
      // Use the duration if 'fromDate' and 'toDate' are not provided
      const duration = parseInt(req.query.duration);
      const currentDate = new Date();

      switch (duration) {
        case 1:
        case 7:
          startDate = new Date(currentDate - duration * 24 * 60 * 60 * 1000);
          endDate = currentDate;
          break;
        case 30:
          startDate = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() - 1,
            currentDate.getDate()
          );
          endDate = currentDate;
          break;
        case 365:
          startDate = new Date(
            currentDate.getFullYear() - 1,
            currentDate.getMonth(),
            currentDate.getDate()
          );
          endDate = currentDate;
          break;
        default:
          startDate = new Date(currentDate - duration * 24 * 60 * 60 * 1000);
          endDate = currentDate;
      }
    }

    const orders = await Order.aggregate([
      {
        $unwind: "$products",
      },
      {
        $match: {
          status: "delivered",
          deliveryDate: { $gte: startDate, $lt: endDate },
        },
      },
      {
        $sort: { deliveryDate: -1 },
      },
      {
        $lookup: {
          from: "products",
          let: { productId: { $toObjectId: "$products.productId" } },
          pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$productId"] } } }],
          as: "products.productDetails",
        },
      },
      {
        $addFields: {
          "products.productDetails": {
            $arrayElemAt: ["$products.productDetails", 0],
          },
        },
      },
    ]);

    const date = new Date();
    const data = {
      orders,
      date,
    };

    if (format === "pdf") {
      let startDate, endDate;
      let duration;

      // If 'fromDate' and 'toDate' are provided, use them to define the date range
      if (fromDate && toDate) {
        startDate = new Date(fromDate);
        endDate = new Date(toDate);
      } else {
        duration = parseInt(req.query.duration);
        const currentDate = new Date();

        switch (duration) {
          case 1:
          case 7:
            startDate = new Date(currentDate - duration * 24 * 60 * 60 * 1000);
            endDate = currentDate;
            break;
          case 30:
            startDate = new Date(
              currentDate.getFullYear(),
              currentDate.getMonth() - 1,
              currentDate.getDate()
            );
            endDate = currentDate;
            break;
          case 365:
            startDate = new Date(
              currentDate.getFullYear() - 1,
              currentDate.getMonth(),
              currentDate.getDate()
            );
            endDate = currentDate;
            break;
          default:
            startDate = new Date(currentDate - duration * 24 * 60 * 60 * 1000);
            endDate = currentDate;
        }
      }

      try {
        const orderData = await Order.find({
          status: "delivered",
          deliveryDate: {
            $gte: startDate,
            $lt: endDate,
            $ne: null,
            $type: "date",
          },
        })
          .sort({ date: -1 })
          .populate("products.productId");

        let dateLabel;

        if (fromDate && toDate) {
          dateLabel = `Custom (${fromDate} to ${toDate})`;
        } else {
          switch (duration) {
            case 1:
              dateLabel = "Daily";
              break;
            case 7:
              dateLabel = "Weekly";
              break;
            case 30:
              dateLabel = "Monthly";
              break;
            case 365:
              dateLabel = "Yearly";
              break;
            default:
              dateLabel = "Custom";
          }
        }

        res.render("ReportPdf", { orderData, date: dateLabel });
      } catch (error) {
        console.error("Error fetching order data:", error);
        res.status(500).sendFile(error500)
      }
    } else if (format === "excel") {
      // Generate and send an Excel report
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Sales Report");

      // Add data to the Excel worksheet (customize as needed)
      worksheet.columns = [
        { header: "Order ID", key: "orderId", width: 8 },
        { header: "Product Name", key: "productName", width: 50 },
        { header: "Qty", key: "qty", width: 5 },
        { header: "Date", key: "date", width: 12 },
        { header: "Customer", key: "customer", width: 15 },
        { header: "Total Amount", key: "totalAmount", width: 12 },
      ];

      // Add rows from the reportData to the worksheet
      orders.forEach((data) => {
        worksheet.addRow({
          orderId: data.uniqueId,
          productName: data.products.productDetails.name,
          qty: data.products.count,
          date: data.date
            .toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "2-digit",
            })
            .replace(/\//g, "-"),
          customer: data.userName,
          totalAmount: data.products.totalPrice,
        });
      });

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=sales_report.xlsx`
      );
      const excelBuffer = await workbook.xlsx.writeBuffer();
      res.end(excelBuffer);
    } else {
      // Handle invalid format
      res.status(400).send("Invalid format specified");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).sendFile(error500)
  }
};

//==========================================chartFilterWeek==============================================
const chartFilterWeek = async (req, res) => {
  try {
    console.log("hh");

    const totalCodWeek = await Order.countDocuments({
      status: "delivered",
      paymentMethod: "COD",
      deliveryDate: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    });
    const totalOnlineWeek = await Order.countDocuments({
      status: "delivered",
      paymentMethod: "onlinePayment",
      deliveryDate: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    });

    const totalWalletWeek = await Order.countDocuments({
      status: "delivered",
      paymentMethod: "wallet",
      deliveryDate: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    });

    res.json([totalCodWeek, totalOnlineWeek, totalWalletWeek]);
  } catch (error) {
    console.error(error.message);
    res.status(500).sendFile(error500)
  }
};

// ========================================chartFilterMonth===============================================
const chartFilterMonth = async (req, res) => {
  try {
    const totalCodMonth = await Order.countDocuments({
      status: "delivered",
      paymentMethod: "COD",
      date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    });

    const totalOnlineMonth = await Order.countDocuments({
      status: "delivered",
      paymentMethod: "onlinePayment",
      date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    });

    const totalWalletMonth = await Order.countDocuments({
      status: "delivered",
      paymentMethod: "wallet",
      date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    });
    res.json([totalCodMonth, totalOnlineMonth, totalWalletMonth]);
  } catch (error) {
    console.log(error.message);
    res.render("500");
  }
};
// ======================================DASHBOARD CHART YEAR FILTER======================================
const chartFilterYear = async (req, res) => {
  try {
    const totalCodYear = await Order.countDocuments({
      status: "delivered",
      paymentMethod: "COD",
      date: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
    });

    const totalOnlineYear = await Order.countDocuments({
      status: "delivered",
      paymentMethod: "onlinePayment",
      date: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
    });

    const totalWalletYear = await Order.countDocuments({
      status: "delivered",
      paymentMethod: "wallet",
      date: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
    });
    res.json([totalCodYear, totalOnlineYear, totalWalletYear]);
  } catch (error) {
    console.log(error.message);
    res.render("500");
  }
};

module.exports = {
  loadlogin,
  loginadmin,
  dashbord,
  adminLogout,
  showuser,
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
  salesReport,
  saleSorting,
  downloadReport,
  chartFilterWeek,
  chartFilterMonth,
  chartFilterYear,
  weeklySalesDataEndpoint,
};
