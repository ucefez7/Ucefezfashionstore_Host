const express = require('express');
const path = require('path');
const app = express(); 
const mongoose = require('mongoose');
const cookieparser = require("cookie-parser");
const session = require("express-session");
const nocache = require("nocache");
const { v4: uuidv4 } = require("uuid"); 

const adminRouter = require("./routes/adminRouter");
const userRouter = require("./routes/userRouter");

app.use(nocache());
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieparser());
app.use(express.static(path.join(__dirname + "/public")));
app.set('view engine','ejs');
// app.set('views',path.join(__dirname,"/views/admin_views"));
// app.set('views',path.join(__dirname,"/views/user_views"));
// app.use(express.static(__dirname+'/public'))
app.use("/uploads", express.static('uploads'))
app.set('views', [path.join(__dirname, "/views/admin_views"), path.join(__dirname, "/views/user_views")]);


app.use(session({
  secret:uuidv4(),
  resave:false,
  saveUninitialized:false,
}));

app.use("/admin",adminRouter);
app.use("/",userRouter);



const PORT = process.env.PORT || 3000;
const MONGO = process.env.MONGO

app.listen(PORT, async(req,res) => {
  try {
    await mongoose.connect(MONGO);
    console.log("SERVER CONNECTED");
    console.log(`http://localhost:${PORT}`);
  }
  catch(err) {
    console.log(err)
  }
})
