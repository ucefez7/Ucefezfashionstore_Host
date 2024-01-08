const userCollection = require("../../models/user_schema");
const adminCollection = require("../../models/admin_schema");
const productCollection = require("../../models/product");


//  getting homepage 
module.exports.getUserRoute = async (req, res,next) => {
  try {
      const loggedIn = req.cookies.loggedIn;
      const username = req.cookies.username; 
      const productdata = await productCollection.find();
      const userData = await userCollection.findOne({ email: req.user });
      const unblockedProducts = productdata.filter(product => product.productStatus !== 'Block');
      res.render("userIndex", { loggedIn,userData, username, productdata: unblockedProducts });
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