const Offer = require("../models/offerModel");
const Cate = require("../models/category");
const productdata = require("../models/productModel");
const mongoose = require("mongoose");
const path = require("path");
const error500 = path.join(__dirname, "views", "error.html");
///=======================offerpage============================================

const offerpage = async (req, res) => {
  try {
    const offer = await Offer.find({});
    res.render("offerpage", { offer: offer });
  } catch (error) {
    console.error(error.message);
    res.status(500).sendFile(error500);
  }
};
//====================addofferPage=============================================
const addofferpage = async (req, res) => {
  try {
    res.render("addoffer");
  } catch (error) {
    console.error(error.message);
    res.status(500).sendFile(error500);
  }
};

//=======================offeradd================================================

const offeradd = async (req, res) => {
  try {
    const data = req.body;
    const offer = new Offer({
      name: req.body.name,
      percentages: req.body.percentages,
      activeDate: req.body.activeDate,
      expDate: req.body.expDate,
    });

    // Save the new address
    let result = await offer.save();
    res.json({ success: true });
  } catch (error) {
    console.error(error.message);
    res.status(500).sendFile(error500);
  }
};

//============================cateapplyoffer=================================

const cateapplyoffer = async (req, res) => {
  try {
    const offer_id = req.body.offerid;
    const cateid = req.body.cateid;
    const { ObjectId } = mongoose.Types; // Import ObjectId from mongoose.Types
    const convertedOfferId = new ObjectId(offer_id);
    const convertedCateId = new ObjectId(cateid);
    const oferData = await Offer.findOne({ _id: convertedOfferId });
    const ceteData = await Cate.findOne({ _id: convertedCateId });

    if (oferData && ceteData) {
      ceteData.offer = oferData._id;
      const productData = await productdata.find({
        category: cateid,
      });
      for (const product of productData) {
        if (product.category === cateid) {
          // Check if the product already has a greater offer
          if (
            !product.offer ||
            oferData.percentages > product.offer.percentages
          ) {
            product.discount =
              product.price - (oferData.percentages * product.price) / 100;
            product.offer = oferData._id;
          }
          await product.save(); // Save the first product that matches the condition
        }
      }
      const updatedCategory = await ceteData.save();

      if (updatedCategory) {
        res.status(200).json({ success: true });
      } else {
        res
          .status(500)
          .json({ success: false, message: "Failed to update category" });
      }
    } else {
      res
        .status(404)
        .json({ success: false, message: "Offer or category not found" });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).sendFile(error500);
  }
};

//==================cateremoveoffer===================================================

const cateremoveoffer = async (req, res) => {
  try {
    const categoryId = req.body.cateid;

    const categoryData = await Cate.findById(categoryId).populate("offer");

    const productData = await productdata
      .find({ category: categoryId })
      .populate("offer");

    for (const product of productData) {
      if (product.offer === null) {
        product.discount = null;
      } else if (product.offer && product.offer.percentages) {
        // If product offer percentage is greater than category offer percentage, keep the excess
        if (product.offer.percentages > categoryData.offer.percentages) {
          product.discount =
            product.price - (product.offer.percentages * product.price) / 100;
        } else {
          // Remove category offer for this product
          product.offer = null;
          product.discount = null;
        }
      }

      await product.save();
    }

    if (categoryData) {
      // Remove category offer
      categoryData.offer = null;
      const updateData = await categoryData.save();

      if (updateData) {
        res.status(200).json({ success: true });
      }
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).sendFile(error500);
  }
};

//===========================proapplyoffer=====================================

const proapplyoffer = async (req, res) => {
  try {
    const offer_id = req.body.offerid;
    const proid = req.body.proid;
    const { ObjectId } = mongoose.Types;
    const convertedOfferId = new ObjectId(offer_id);
    const convertedPrId = new ObjectId(proid);
    // Move the declaration of productData here
    const productData = await productdata
      .findOne({ _id: convertedPrId })
      .populate("offer");
    const convertedCateId = new ObjectId(productData.category);
    const offerData = await Offer.findOne({ _id: convertedOfferId });
    const categoryData = await Cate.findOne({ _id: convertedCateId }).populate(
      "offer"
    );
    if (
      categoryData.offer == null ||
      categoryData.offer.percentages < offerData.percentages
    ) {
      productData.offer = convertedOfferId;
      productData.discount =
        productData.price - (offerData.percentages * productData.price) / 100;
    } else {
      // Respond with a message indicating that the offer was not added
      res.json({ notAdded: true, message: "Offer percentage not higher" });
      return; // Stop further execution
    }
    const updatedProduct = await productData.save();
    if (updatedProduct) {
      // Respond with a success status
      res.status(200).json({ success: true });
    } else {
      // Respond with an error status if the save operation fails
      res
        .status(500)
        .json({ success: false, message: "Failed to update product" });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).sendFile(error500);
  }
};

//===========================proofferRemove========================================
const proofferRemove = async (req, res) => {
  try {
    const proId = req.body.cateid;
    const { ObjectId } = mongoose.Types;
    const convertedProId = new ObjectId(proId);
    const prodata = await productdata.findById(convertedProId);
    if (!prodata) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" })
        .populate("offer");
    }
    const cateId = prodata.category;
    const convertedCateId = new ObjectId(cateId);
    const categoryData = await Cate.findOne({ _id: convertedCateId }).populate(
      "offer"
    );
    if (categoryData.offer === null) {
      prodata.offer = null;
      prodata.discount = null;
    } else {
      prodata.offer = null;
      prodata.discount =
        prodata.price - (categoryData.offer.percentages * prodata.price) / 100;
    }
    const updatedProduct = await prodata.save();
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(error.message);
    res.status(500).sendFile(error500);
  }
};
//======================editofferpage================================================
const editofferpage = async (req, res) => {
  try {
    const offerdata = await Offer.findOne({ _id: req.query.id });
    res.render("editOffer", { offerdata });
  } catch (error) {
    console.error(error.message);
    res.status(500).sendFile(error500);
  }
};
//======================editoffer===================================================

const editoffer = async (req, res) => {
  try {
    const data = req.body;
    const offerId = req.query.id;
    const updated = await Offer.updateOne(
      { _id: offerId },
      {
        $set: {
          name: req.body.name,
          percentages: req.body.percentages,
          activeDate: req.body.activeDate,
          expDate: req.body.expDate,
        },
      }
    );
    res.json({ success: true });
  } catch (error) {
    console.error(error.message);
    res.status(500).sendFile(error500);
  }
};

//===========================block an un block offer======================================

const blockOffer = async (req, res) => {
  try {
    const coupen = await Offer.findOne({ _id: req.query.id });
    if (coupen.blocked == 0) {
      await Offer.updateOne({ _id: req.query.id }, { $set: { blocked: 1 } });
    } else {
      await Offer.updateOne({ _id: req.query.id }, { $set: { blocked: 0 } });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).sendFile(error500);
  }
};

module.exports = {
  offerpage,
  addofferpage,
  offeradd,
  cateapplyoffer,
  proapplyoffer,
  cateremoveoffer,
  editofferpage,
  editoffer,
  blockOffer,
  proofferRemove,
};
