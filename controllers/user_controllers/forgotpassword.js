const userCollection = require("../../models/user_schema");


//reset password
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const address = require("../../models/address");
const order = require("../../models/order");
const saltRounds = 10;
let generatedOTP; 


module.exports.userForgotpassword= async (req, res) => {
  const username = req.cookies.username;
  res.render("forgotpassword",{username});
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTP = async (email, generatedOTP) => {
  try {
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

    const mailOptions = {
      from: `"Ucefez Fashion Store" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Account verification mail",
      text: `Your OTP for Changing Password is: ${generatedOTP}`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email has been sent: " + info.response);
    return true; // Indicates success
  } catch (error) {
    console.error(error);
    return false; // Indicates failure
  }
};

//to verify OTP
const verifyOTP = (otpInput, generatedOTP) => {
  return otpInput === generatedOTP;
  
};

module.exports.postforget = async (req, res,next) => {
  try {
    const email = req.body.email;
    const newPassword = req.body.password;
        const data = await userCollection.findOne({
      email: req.body.email,
    });
    const isSameAsPrevious = await bcrypt.compare(newPassword, data.password);
    if (!data) {
      res.status(200).json({ error: "Email is not Registered" });
    } else if (req.body.password !== req.body.confirmpassword) {
      res.status(200).json({ error: "Both passwords are not the same" });
    } else if (isSameAsPrevious) {
      res.status(200).json({ error: "This is the old password" });
    }{    
                generatedOTP = generateOTP();
                const success = sendOTP(email, generatedOTP);
                if (success) {
                  res
                    .status(200)
                    .json({ message: "OTP sent to email successfully" });
                } else {
                  res.status(500).json({ error: "Failed to send OTP email" });
                }
      
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};



module.exports.postreset= async(req,res,next)=>{
  try {

    email=req.body.email;
    password=req.body.password;
    const otpInput = req.body.otpInput;
   
    const isVerified = verifyOTP(otpInput, generatedOTP);

    if (isVerified) {
      // const hashedPassword = await bcrypt.hash(password, saltRounds);  
      await userCollection.updateOne(
        { email: email },
        { $set:{password: password}}
        );   
        console.log(email +" "+ password)
        console.log("Verified Successfully")
        res.status(200).json({ message: "Otp Verified Successfully" });
      
    

    } else {  
      console.log(" the otp is "+generatedOTP)
      res.status(200).json({ error: "Invalid OTP" });
    }
    
  } catch (error) {
    console.log(error)
    next(error);
  }

}