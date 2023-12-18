const adminCollection = require("../models/admin_schema");
const jwt = require("jsonwebtoken");
const cookieparser = require("cookie-parser");
require("dotenv").config();

module.exports.verifyadmin = (req,res,next) => {
  const token = req.cookies.token;
  const verifyToken = jwt.verify(
    token, 
    process.env.JWT_SECRET_KEY,
    (err, decoded) => {
      if(err) {
        return res.redirect ("/admin");
      }
      req.user = decoded;
      next();
    }
  )
};