const userCollection = require("../models/user_schema");
const jwt = require("jsonwebtoken");
const cookieparser = require("cookie-parser");
require("dotenv").config();

module.exports.verifyUser = (req,res,next) => {
  const token = req.cookies.token;
  const verifyToken = jwt.verify(
    token, 
    process.env.JWT_SECRET_KEY,
    (err, decoded) => {
      if(err) {
        return res.redirect ("/login");
      }
      req.user = decoded;
      next();
    }
  )
};


module.exports.checkBlockedStatus = async (req, res, next) => {
  user = req.user
  const curruser = await userCollection.findOne({email: user})
  if(curruser.status === "Block") {
    res.clearCookie("token");
    res.clearCookie("loggedIn");
    res.render("user-login", {subreddit: "User is blocked"})
  }
  next()
};
