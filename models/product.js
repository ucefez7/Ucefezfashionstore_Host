const mongoose = require("mongoose");

const productSchema = new mongoose.Schema ({
  productName: {
    require: true,
    type: String,
  },
  productDiscription: {
    require: true,
    type: String,
  },
  productCategory: {
    require: true,
    type:String
  },
  productBrand: {
    require: true,
    type: String,
  },
  regularPrice: {
    require: true,
    type: Number,
  },
  sellingPrice: {
    require: true,
    type: Number,
  },
  productSize: {
    require: true,
    type: String,
  },
  productStock: {
    require: true,
    type: Number,
  },
  productImg: {
    require: true,
    type: Array
  },
  productStatus: {
    require: true,
    type: String,
  },
  offerStart: Date,
  offerEnd: Date,
  discountPercent: Number,
  discountStatus: {
    type: String,
    default: "Active",
  },
});


const productCollection = mongoose.model("productCollection", productSchema);

module.exports = productCollection;