const mongoose = require("mongoose")

const offerSchema = new mongoose.Schema({
  offerName: {
    type: String,
    required: true,
  },
  offerType: {
    type: String,
    required: true,
  },
  discountPercentage: {
    type: Number,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: false,
  },
  status: {
    type: String,
    default: "Unblock"
  },
  isActive: {
    type: Boolean,
    default: true,
  },
},
{ timestamps: true }
);

const offerCollection = mongoose.model("offerCollection", offerSchema)
module.exports = offerCollection;