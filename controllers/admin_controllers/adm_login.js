const mongoose = require("mongoose");
const multer = require("multer");
//const {uploads} = require("../multer-middleware/multer_middleware")

const adminCollection = require("../../models/admin_schema");

require('dotenv').config();
const jwt = require("jsonwebtoken");
const secretkey = process.env.JWT_SECRET_KEY


// render loging page
module.exports.getAdminLogin = (req,res) => {
  res.render("admin-login");
}

// checking details and loging
module.exports.adminPostLogin = async(req,res) => {
  const admindata = await adminCollection.findOne({ email: req.body.email});
  if (!admindata) {
    res.render("admin-login", {subreddit: "The emial is not registered"});
  } else {
    if (admindata){
      if (req.body.email != admindata.email) 
      {
        res.render("admin-login", {subreddit:"This email not registered"});
      } else if (req.body.password != admindata.password) 
      {
        res.render("admin-login", {subreddit: "Incorrect passaword"});
      } else 
      {
        if ( req.body.email == admindata.email && req.body.password == admindata.password ) 
        { 
          try {
          email = req.body.email;
          const token = jwt.sign(email, secretkey);
          res.cookie("token", token, { maxAge: 24 * 60 * 60 * 1000 });
          res.cookie("loggedIn", true, { maxAge: 24 * 60 * 60 * 1000 });
          res.status(200);
          // res.render("admin-dashboard")
            res.redirect("/admin/admin-dash")
          } catch (error) {
              console.log(error);
              res.status(500).json({ error: "Internal Server Error" });
          }
        } 
      }
    } else {
      res.redirect("/admin");
    }
  }
}

// module.exports.getAdminDashboard = async(req,res) => {
//   try {
//     res.render("admin-dashboard")
//   } catch (error) {
//     console.error(error)
//   }
// }

// logout
module.exports.getLogout = async (req,res) => {
  res.clearCookie("token");
  res.clearCookie("loggedIn");
  res.redirect("/admin")
}


