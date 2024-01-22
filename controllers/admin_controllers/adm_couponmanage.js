const mongoose = require("mongoose");
const orderCollection = require("../../models/order");
const userCollection = require("../../models/user_schema");
const productCollection = require("../../models/product");
const couponCollection = require("../../models/coupon");

// render coupon list
module.exports.getCouponlist = async (req, res) => {
  try {
    const coupons = await couponCollection.find();
    res.render("admin-couponlist", { coupons });
  } catch (error) {
    console.error("Error: ", error);
  }
};

// render add coupon page
module.exports.addCoupon = async (req, res) => {
  try {
    res.render("admin-addcoupon");
  } catch (error) {
    console.error("Error: ", error);
  }
};

// save coupon
module.exports.postCoupon = async (req, res) => {
  try {
    const {
      couponCode,
      description,
      discountAmount,
      minimumPurchase,
      expiryDate,
      status,
    } = req.body;

    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    let startDateObj = new Date(expiryDate);

    const existingcoupon = await couponCollection.findOne({
      couponCode: couponCode,
    });
    if (existingcoupon) {
      res.status(400).json({ error: "Coupon code already exists" });
    } else if (startDateObj < currentDate) {
      return res
        .status(400)
        .json({ error: "Expiry date must be in the future" });
    } else if (discountAmount >= minimumPurchase) {
      return res
        .status(400)
        .json({
          error: "Discount amount must be less than minimum Purchase amount",
        });
    } else if (
      !couponCode ||
      !description ||
      !discountAmount ||
      !minimumPurchase ||
      !expiryDate ||
      !status
    ) {
      return res.status(400).json({ error: "All fields are required." });
    } else {
      await couponCollection.create({
        couponCode: couponCode,
        description: description,
        discountAmount: discountAmount,
        minimumPurchase: minimumPurchase,
        expiryDate: expiryDate,
        status: status,
      });
      res.status(200).json({ message: "Coupon added succussfully" });
    }
  } catch (error) {
    console.error("Error: ", error);
  }
};

// render coupon edit
module.exports.editCoupon = async (req, res) => {
  try {
    const couponId = req.params.couponId;
    const coupon = await couponCollection.findById({ _id: couponId });
    res.render("admin-editcoupon", { coupon });
  } catch (error) {
    console.error("Error: ", error);
  }
};

// save edited coupon
module.exports.postEditcoupon = async (req, res) => {
  try {
    const {
      couponId,
      couponCode,
      description,
      discountAmount,
      minimumPurchase,
      expiryDate,
      status,
    } = req.body;

    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    let startDateObj = new Date(expiryDate);

    const coupon = await couponCollection.findById(couponId);

    if (couponCode !== coupon.couponCode) {
      const existingCoupon = await couponCollection.findOne({
        couponCode: couponCode,
      });
      if (existingCoupon) {
        return res.status(400).json({ error: "Coupon already exists" });
      }
    } else if (startDateObj < currentDate) {
      return res
        .status(400)
        .json({ error: "Expiry date must be in the future" });
    } 
    // else if (discountAmount >= minimumPurchase) {
    //   return res
    //     .status(400)
    //     .json({
    //       error: "Discount amount must be less than minimum Purchase amount",
    //     });
    // }
     else {
      (coupon.couponCode = couponCode),
        (coupon.description = description),
        (coupon.discountAmount = discountAmount),
        (coupon.minimumPurchase = minimumPurchase),
        (coupon.expiryDate = expiryDate),
        (coupon.status = status),
        await coupon.save();

      res.status(200).json({ message: "Coupon updated succussfully" });
    }
  } catch (error) {
    console.error("Error: ", error);
  }
};

// block category
module.exports.blockCoupon = async (req, res) => {
  try {
    const couponId = req.params.couponId;
    const updatedStatus = await couponCollection.updateOne(
      { _id: couponId },
      { $set: { status: "Block" } }
    );
    res.redirect("/admin/coupon-list");
  } catch (error) {
    console.error(error);
  }
};

// unblock category
module.exports.unblockCoupon = async (req, res) => {
  try {
    const couponId = req.params.couponId;
    const updatedStatus = await couponCollection.updateOne(
      { _id: couponId },
      { $set: { status: "Unblock" } }
    );
    res.redirect("/admin/coupon-list");
  } catch (error) {
    console.error(error);
  }
};
