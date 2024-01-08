const mongoose = require("mongoose");
const sharp = require("sharp");
const productCollection = require("../../models/product");

module.exports.cropimage = async(req,res) =>{
    const productId = req.params.productId;
    const productdata = await productCollection.findOne({ _id: productId });
    res.render("admin-cropimage", {productdata});
} 
module.exports.PostCrop = async(req,res)=>{
    try {
   const { croppedImage, productId, imageIndex } = req.body;
   const base64Data = croppedImage.replace(/^data:image\/png;base64,/, "");
   const buffer = Buffer.from(base64Data, "base64");

   const resizedImageBuffer = await sharp(buffer)
     .resize({ width: 300, height: 300, fit: "cover" })
     .toBuffer();

   const filename = `cropped_${Date.now()}_${imageIndex}.png`;
   const filePath = `uploads/${filename}`;
   await sharp(resizedImageBuffer).toFile(filePath);
   const updateQuery = {
     $set: {
       [`productImg.${imageIndex}`]: filePath,
     },
   };
   await productCollection.findByIdAndUpdate(productId, updateQuery);
    res.status(200).json({ message: "Image Cropped Successfully." });
  } catch (error) {
    console.log(error)
    next(error)
}
}