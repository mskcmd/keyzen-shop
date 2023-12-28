const productdata = require("../models/productModel");
const bcrypt = require("bcrypt");
const multer = require("../midileware/mullter");
const Sharp = require("sharp");
const Cate = require("../models/category");
const Offer = require("../models/offerModel");
const path = require("path");
const error500 = path.join(__dirname, "views", "error.html");

//==============================productlist===================================

const productlist = async (req, res) => {
  try {
    const offer = await Offer.find({});

    var page = 1;
    var limit = 8;
    if (req.query.page) {
      page = req.query.page;
    }
    const productData = await productdata
      .find({})
      .limit(limit)
      .skip((page - 1) * limit)
      .populate("offer")
      .exec();

    const catIds = productData.map((product) => product.category);
    const count = await productdata.find({}).countDocuments();
    const totalPages = Math.ceil(count / limit);
    // Assuming your category model has a 'name' field, adjust it based on your actual model structure
    const cate = await Cate.find({ _id: { $in: catIds } }, "name");

    res.render("product", {
      product: productData,
      cate,
      offer,
      currentPage: page,
      totalPages: totalPages,
    });
  } catch (error) {
    console.log(error.message);
    // Handle the error appropriately, e.g., send an error response to the client
    res.status(500).sendFile(error500);
  }
};

//==============================addProduct===================================

const addProduct = async (req, res) => {
  try {
    const catData = await Cate.find({ blocked: 0 });
    res.render("productadd", { catData: catData });
  } catch (error) {
    console.log(error.message);
  }
};
//==============================inserproduct===================================

const inserproduct = async (req, res) => {
  try {
    const already = await productdata.findOne({ name: req.body.name });
    if (already) {
      res.redirect("/admin/addProduct");
    } else {
      let details = req.body;
      const selectedCategoryId = req.body.category;
      const category = await Cate.findById(selectedCategoryId);
      const categoryName = category.name;

      const files = await req.files;

      const img = [
        files.image1[0].filename,
        files.image2[0].filename,
        files.image3[0].filename,
        files.image4[0].filename,
      ];

      for (let i = 0; i < img.length; i++) {
        await Sharp("public/products/images/" + img[i])
          .resize(480, 480)
          .toFile("public/products/crope/" + img[i]);
      }

      // // Fetch the category ID based on the category name (assuming a case-insensitive match)
      // const category = await category.findOne({ name: details.category }, '_id');

      let product = new productdata({
        name: details.name,
        price: details.price,
        quantity: details.quantity,
        categoryName: categoryName,
        category: details.category, // Set the category field with the _id of the found category
        description: details.description,
        blocked: 0,
        "images.image1": files.image1[0].filename,
        "images.image2": files.image2[0].filename,
        "images.image3": files.image3[0].filename,
        "images.image4": files.image4[0].filename,
      });

      let result = await product.save();
      res.redirect("/admin/Product");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).sendFile(error500);
  }
};

//==============================problock===================================

const problock = async (req, res) => {
  try {
    const blockedproduct = await productdata.findOne({ _id: req.query.id });
    if (blockedproduct.blocked == 0) {
      await productdata.updateOne(
        { _id: req.query.id },
        { $set: { blocked: 1 } }
      );
      res.json({ success: true });
    } else {
      await productdata.updateOne(
        { _id: req.query.id },
        { $set: { blocked: 0 } }
      );
      res.json({ success: true });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).sendFile(error500);
  }
};

//==============================product update page============================

const prouppage = async (req, res) => {
  try {
    const catData = await Cate.find({ blocked: 0 });
    const editProducts = await productdata.findOne({ _id: req.query.id });
    res.render("editProduct", { product: editProducts, catData: catData });
  } catch (error) {
    console.log(error.message);
  }
};

//==============================editProduct===================================

const editProduct = async (req, res) => {
  try {
    let details = req.body;
    let imagesFiles = req.files || {};
    let currentData = await productdata.findOne({ _id: req.query.id });
    const selectedCategoryId = req.body.category;
    const category = await Cate.findById(selectedCategoryId);
    const categoryName = category.name;

    const img = [
      imagesFiles.image1?.[0]?.filename || currentData.images.image1,
      imagesFiles.image2?.[0]?.filename || currentData.images.image2,
      imagesFiles.image3?.[0]?.filename || currentData.images.image3,
      imagesFiles.image4?.[0]?.filename || currentData.images.image4,
    ];

    for (let i = 0; i < img.length; i++) {
      await Sharp("public/products/images/" + img[i])
        .resize(480, 480)
        .toFile("public/products/crope/" + img[i]);
    }

    let img1, img2, img3, img4;

    img1 = imagesFiles.image1
      ? imagesFiles.image1[0].filename
      : currentData.images.image1;
    img2 = imagesFiles.image2
      ? imagesFiles.image2[0].filename
      : currentData.images.image2;
    img3 = imagesFiles.image3
      ? imagesFiles.image3[0].filename
      : currentData.images.image3;
    img4 = imagesFiles.image4
      ? imagesFiles.image4[0].filename
      : currentData.images.image4;

    let update = await productdata.updateOne(
      { _id: req.query.id },
      {
        $set: {
          name: details.name,
          price: details.price,
          quantity: details.quantity,
          categoryName: categoryName,
          category: details.category,
          description: details.description,
          "images.image1": img1,
          "images.image2": img2,
          "images.image3": img3,
          "images.image4": img4,
        },
      }
    );

    res.redirect("/admin/Product");
  } catch (error) {
    console.error(error.message);
    res.status(500).sendFile(error500);
  }
};

module.exports = {
  productlist,
  inserproduct,
  addProduct,
  problock,
  prouppage,
  editProduct,
};
