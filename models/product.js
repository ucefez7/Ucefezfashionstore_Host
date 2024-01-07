const mongoose = require("mongoose");
const mongoosePaginate = require('mongoose-paginate-v2');
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
});

productSchema.plugin(mongoosePaginate);
const productCollection = mongoose.model("productCollection", productSchema);

module.exports = productCollection;