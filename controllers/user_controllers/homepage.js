const userCollection = require("../../models/user_schema");
const adminCollection = require("../../models/admin_schema");
const productCollection = require("../../models/product");
const categoryCollection = require("../../models/category");
const offerController = require("../admin_controllers/adm_offermanage");

const jwt = require("jsonwebtoken");
const cookieparser = require("cookie-parser");
const couponCollection = require("../../models/coupon");
const offerCollection = require("../../models/offer");
require("dotenv").config();

// //  getting homepage 
// module.exports.getUserRoute = async (req, res,next) => {
//   try {
//       const loggedIn = req.cookies.loggedIn;
//       const username = req.cookies.username; 
//       const productdata = await productCollection.find();
//       const userData = await userCollection.findOne({ email: req.user });
//       const unblockedProducts = productdata.filter(product => product.productStatus !== 'Block');
//       res.render("userIndex", { loggedIn,userData, username, productdata: unblockedProducts });
//   } catch (error) {
//       console.error(error);
//       next(error);
//   }
// };


//  getting homepage
module.exports.getUserRoute = async (req, res, next) => {
  try {
    const loggedIn = req.cookies.loggedIn;
    await offerController.deactivateExpiredOffers();

    // decoding from token
    const token = req.cookies.token;
    const verifyToken = jwt.verify(
      token,
      process.env.JWT_SECRET_KEY,
      (err, decoded) => {
        if (err) {
          // return res.redirect ("/login");
          console.log("error");
        }
        req.user = decoded;
      }
    );

    let categorydata = await categoryCollection.find();
    categorydata = categorydata.filter(
      (category) => category.categoryStatus !== "Block"
    );

    let productdata = await productCollection.find();
    productdata = productdata.filter(
      (product) => product.productStatus !== "Block"
    );

    const offerData = await offerCollection.find({
      isActive: true,
      status: "Unblock",
    });
    const categoryOffers = await offerCollection.find({
      offerType: "category",
      isActive: true,
    });
    const productOffers = await productCollection.find({
      discountStatus: "Active",
    });

    if (req.user) {
      const userData = await userCollection.findOne({ email: req.user });
      const username = userData.username;
      res.render("userIndex", {
        loggedIn,
        username,
        productdata,
        categorydata,
        productOffers,
      });
    } else {
      res.render("userIndex", {
        loggedIn,
        productdata,
        categorydata,
        productOffers,
      });
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
};



// logout
module.exports.getLogout = (req,res) => {
  res.clearCookie("token");
  res.clearCookie("loggedIn");
  res.redirect("/login")
}