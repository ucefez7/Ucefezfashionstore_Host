const userCollection = require("../../models/user_schema");
const productCollection = require("../../models/product");

require('dotenv').config();
const jwt = require("jsonwebtoken");
const secretkey = process.env.JWT_SECRET_KEY

// render product detail page
module.exports.productDetails = async(req,res) => {
  try{
    const loggedIn = req.cookies.loggedIn;
    const username = req.cookies.username;
    const Idproduct = req.params.productId;
    const productdata = await productCollection.findById({_id:Idproduct})
    res.render("user-productdetails", {loggedIn, username, productdata})
  } catch(error) {
    console.error(error)
  }
}