const mongoose = require("mongoose")

const couponSchema = new mongoose.Schema({

  redeemedUser: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "userCollection",
    },
  ],
  couponCode: {
    type: String,
    unique: true,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  discountAmount: {
    type : Number,
    required: true,
  },
  minimumPurchase: {
    type: Number,
    required: true,
  },
  expiryDate: {
    type: Date,
  },
  status: {
    type: String,
    default: "Unblock"
  },

})

const couponCollection = mongoose.model("couponCollection", couponSchema);
module.exports = couponCollection;