const mongoose = require("mongoose");
const multer = require("multer");
const sharp = require("sharp");
const productCollection = require("../../models/product");

module.exports.cropimage = async (req, res) => {
  try {
    const productId = req.params.productId;
    const productdata = await productCollection.findOne({ _id: productId });
    console.log(productdata);
    res.render("admin-cropimage", { productdata });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports.PostCrop = async (req, res) => {
  try {
    const { croppedImage } = req.body;

    // Replace the "data:image/png;base64," prefix with an empty string
    const base64Data = croppedImage.replace(/^data:image\/png;base64,/, "");

    console.log("Base64 data extracted");

    // Generate a unique filename using the current timestamp
    const filename = `cropped_${Date.now()}.png`;
    console.log("Filename generated:", filename);

    // Save the cropped image
    // Assuming you have a folder named "uploads" to save the cropped images
    const filePath = `uploads/${filename}`;
    await sharp(Buffer.from(base64Data, "base64"))
      .toFile(filePath);

    // Update the product data in the database with the new image path
    const productId = req.params.productId;
    await productCollection.findByIdAndUpdate(productId, {
      $set: { productImg: [filePath] },
    });

    // Respond with success
    res.status(200).json({ message: "Cropped image received successfully.", filePath });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
