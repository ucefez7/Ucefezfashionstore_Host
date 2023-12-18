const mongoose = require("mongoose");
const userSchema  = new mongoose.Schema({
  username: {
    required: true,
    type: String,
  },
  email: {
    required: true,
    type: String,
    unique: true
  },
  phoneNumber: {
    required: true,
    type: Number, 
    unique: true,
  },
  password: {
    required: true,
    type: String,
  },
  status: {
    type: String,
  },
});

const userCollection = mongoose.model("userCollection",userSchema);
module.exports = userCollection;