const userCollection = require("../../models/user_schema");
const adminCollection = require("../../models/admin_schema");
const productCollection = require("../../models/product");
const walletCollection = require("../../models/wallet");
var randomstring = require("randomstring");
const bcrypt = require("bcrypt");
require('dotenv').config();

const jwt = require("jsonwebtoken");
const secretkey = process.env.JWT_SECRET_KEY


const nodemailer = require('nodemailer');


//  user signup
module.exports.getUserSignup = (req,res) => {
  res.render("user-signup");
}


// // creating a user in usersignup
// module.exports.postUserSignup = async (req,res) => {
//   const email = await userCollection.findOne({ email: req.body.email });
//   const phoneNumber = await userCollection.findOne({ phoneNumber: req.body.phoneNumber });

//   //generating referral code
//   let codeId = randomstring.generate(12);

//   if(email) {
//     res.render("user-signup", { error: "Email already exists" })
//   } else if(phoneNumber) {
//     res.render("user-signup", { error: "PhoneNumber already exists" })
//   } else {
//     await userCollection.create({
//       username: req.body.username,
//       email: req.body.email,
//       password: req.body.password, 
//       phoneNumber: req.body.phoneNumber,
//       // otpInput:req.body.otpInput,
//       status:"Unblock",
//       referelId: codeId,
//     });
//     const currUser = await userCollection.findOne({ email: req.body.email });
//     await walletCollection.create({
//       userId: currUser._id,
//       amount: 0,
//     });
//     res.render("user-login", {message: "User sign up successfully"});
//   }
// }

// creating a user in usersignup
module.exports.postUserSignup = async (req, res) => {
  try {
    const email = await userCollection.findOne({ email: req.body.email });
    const phoneNumber = await userCollection.findOne({ phoneNumber: req.body.phoneNumber });

    
    const referralCode = req.query.referralCode;

    console.log(req.body);

    
    // let codeId = referralCode || randomstring.generate(12);
    let codeId =randomstring.generate(12);


    if (email) {
      res.render("user-signup", { error: "Email already exists" });
    } else if (phoneNumber) {
      res.render("user-signup", { error: "PhoneNumber already exists" });
    } else {
      const newUser = await userCollection.create({
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
        phoneNumber: req.body.phoneNumber,
        status: "Unblock",
        referelId: codeId,
      });

      const currUser = await userCollection.findOne({ email: req.body.email });

      
      if (referralCode) {
        const usedReferel = await userCollection.findOne({ referelId: referralCode });

        if (usedReferel && !usedReferel.redmmedreferels.includes(newUser._id)) {
          usedReferel.redmmedreferels.push(newUser._id);
          await usedReferel.save();

          
          const userWallet = await walletCollection.findOne({ userId: currUser._id });
          userWallet.amount += 200;
          await userWallet.save();
         
          
          const referedUserWallet = await walletCollection.findOne({ userId: usedReferel._id });
          referedUserWallet.amount += 200;
          await referedUserWallet.save();


          
          await userCollection.updateOne({ _id: currUser._id }, { $set: { appliedReferel: true } });

          return res.render("user-login", { message: "User sign up successfully with referral" });
        }
      }

     
      await walletCollection.create({
        userId: currUser._id,
        amount: 0,
      });

      return res.render("user-login", { message: "User sign up successfully" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};





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
      
        res.status(200).json({error: "User already exists"})
      
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


