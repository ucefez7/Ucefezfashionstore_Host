const userCollection = require("../../models/user_schema");
const adminCollection = require("../../models/admin_schema");
const productCollection = require("../../models/product");

require('dotenv').config();
const jwt = require("jsonwebtoken");
const secretkey = process.env.JWT_SECRET_KEY


const nodemailer = require('nodemailer');


//  user signup
module.exports.getUserSignup = (req,res) => {
  res.render("user-signup");
}


// creating a user in usersignup
module.exports.postUserSignup = async (req,res) => {
  const email = await userCollection.findOne({ email: req.body.email });
  const phoneNumber = await userCollection.findOne({ phoneNumber: req.body.phoneNumber });
  if(email) {
    res.render("user-signup", { error: "Email already exists" })
  } else if(phoneNumber) {
    res.render("user-signup", { error: "PhoneNumber already exists" })
  } else {
    await userCollection.create({
      username: req.body.username,
      email: req.body.email,
      password: req.body.password, 
      phoneNumber: req.body.phoneNumber,
      // otpInput:req.body.otpInput,
      status:"Unblock",
    })
    res.render("user-login", {message: "User sign up successfully"});
  }
}

// generating otp for node mailer
let generatedOTP = null;
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000);
}


// sending otp 
module.exports.getSendOtp = async (req,res,next) => {
  try {
    const phoneNumber = req.query.phoneNumber;
    const existingUser = await userCollection.findOne({
      $or: [
          { email: req.query.email },
          { phoneNumber: phoneNumber }
      ]
    });
    if (existingUser) {
      // Handle the case where either email or phoneNumber already exists
      // if (existingUser.email === req.query.email && existingUser.phoneNumber === req.query.phoneNumber) {
        res.status(200).json({error: "User already exists"})
      // } else  {
        // res.status(200).json({error: "User already exists"})
      // }
  } else 
  {

    const email = req.query.email;

    generatedOTP = generateOTP();

      // Create a Transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD,
      },
    }); 

      //  Compose and Send an Email
    const mailOptions = {
      from: `"Ucefez Fashion Store" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Account verification mail',
      text: `Your OTP for verification is: ${generatedOTP}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
      } else {
        console.log('Email has been sent: ' + info.response);
      }
    });
  
    res.status(200).json({message: "OTP send to email successfully"})
  }
  } catch (error) {
    console.error(error)
    next(error);
  }
} 

// verify otp
module.exports.postVerifyOtp = async (req, res,next) => {
  try {
    const userEnteredOTP = req.query.otpInput;

    if (userEnteredOTP && generatedOTP && userEnteredOTP === generatedOTP.toString()) {
      // OTP is correct
      res.status(200).json({ message: "OTP verification successful" });
    } else {
      // Incorrect OTP
      res.status(400).json({ error: "Incorrect OTP" });
    }

  } catch (error) {
    console.error(error);
    
    next(error);
  }
}


