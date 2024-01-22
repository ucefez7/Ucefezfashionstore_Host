const mongoose = require("mongoose")

const walletSchema  = new mongoose.Schema({
  userId : {
    type: mongoose.Schema.Types.ObjectId,
    ref: "userCollection",
  },
  amount: {
    type: Number,
    default: '0',
  },
});

const walletCollection = mongoose.model("walletCollection", walletSchema)
module.exports = walletCollection