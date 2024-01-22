const userCollection = require("../../models/user_schema");
const productCollection = require("../../models/product");
const offerCollection = require("../../models/offer");
const offerController = require("../admin_controllers/adm_offermanage");

require('dotenv').config();
const jwt = require("jsonwebtoken");
const secretkey = process.env.JWT_SECRET_KEY

// // render product detail page
// module.exports.productDetails = async(req,res,next) => {
//   try{
//     const loggedIn = req.cookies.loggedIn;
//     const username = req.cookies.username;
//     const Idproduct = req.params.productId;
//     const productdata = await productCollection.findById({_id:Idproduct})
//     res.render("user-productdetails", {loggedIn, username, productdata})
//   } catch(error) {
//     console.error(error)
//     next(error);
//   }
// }

// render product detail page
module.exports.productDetails = async (req, res, next) => {
  try {
    await offerController.deactivateExpiredOffers();
    const loggedIn = req.cookies.loggedIn;
    const userData = await userCollection.findOne({ email: req.user });
    const username = userData.username;
    const Idproduct = req.params.productId;
    const productdata = await productCollection.findById({ _id: Idproduct });
    const category = productdata.productCategory;
    const relatedProducts = await productCollection.find({
      productCategory: category,
    });
    const offerData = await offerCollection.find({
      isActive: true,
      status: "Unblock",
    });
    res.render("user-productdetails", {
      loggedIn,
      username,
      productdata,
      offerData,
      relatedProducts,
    });
  } catch(error) {
    console.error(error)
    next(error);
  }
}