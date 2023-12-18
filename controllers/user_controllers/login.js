const userCollection = require("../../models/user_schema");
const adminCollection = require("../../models/admin_schema");
const productCollection = require("../../models/product");

require('dotenv').config();
const jwt = require("jsonwebtoken");
const secretkey = process.env.JWT_SECRET_KEY


// gettting login page
module.exports.getLogin = (req,res) => {
  if(req.cookies.logindata) {
    res.redirect("/");
  } else { 
    res.render("user-login");
  }
}


// checking user details and loging
module.exports.postLogin = async (req, res) => {
  const logindata = await userCollection.findOne({ email: req.body.email });
  if (!logindata) {
      res.status(200).json({ error: "The email is not registered" });
  } else if (logindata) {
      if (logindata.status === "Block") {
          res.status(200).json({ error: "User is blocked" });
      } else if (req.body.password !== logindata.password) {
          res.status(200).json({ error: "Incorrect password" });
      } else {
          if (req.body.email === logindata.email && req.body.password === logindata.password) {
              try {
                  email = req.body.email;
                  const token = jwt.sign(email, secretkey);
                  res.cookie("token", token, { maxAge: 24 * 60 * 60 * 1000 });
                  res.cookie("loggedIn", true, { maxAge: 24 * 60 * 60 * 1000 });
                  res.cookie("username", logindata.username);
                  res.status(200).json({ success: true });
                //   res.redirect("/")
              } catch (error) {
                  console.log(error);
                  res.status(500).json({ error: "Internal Server Error" });
              }
          } else {
              res.status(400).json({ error: "Invalid credentials" });
          }
      }
  }
};


