const mongoose = require("mongoose");
const multer = require("multer");
const sharp = require('sharp')
//const {uploads} = require("../multer-middleware/multer_middleware")

const categoryCollection = require("../../models/category");
const productCollection = require("../../models/product");

const mongoosePaginate = require('mongoose-paginate-v2');

module.exports.getProductList = async (req, res,next) => {
  try {
    const page = parseInt(req.query.page) || 1; // Get the page from the query parameters
    const pageSize = 5; // Set the number of items per page

    const options = {
      page,
      limit: pageSize,
    };

    // Use the paginate function provided by mongoose-paginate-v2
    const result = await productCollection.paginate({}, options);

    res.render('admin-productlist', {
      productdata: result.docs,
      currentPage: page,
      totalPages: result.totalPages,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

// // render product list page
// module.exports.getProductList = async(req,res) => {
//   try {
//     const productdata = await productCollection.find()
//     res.render("admin-productlist", {productdata});
//   } catch (error) {
//     console.error(error);
//   }
// }


// render add product page og
module.exports.getAddProduct = async(req,res,next) => {
  try {
    const categorydata = await categoryCollection.find();
    const categories = Array.isArray(categorydata)
    ? categorydata
    : [categorydata];
    res.render("admin-addproduct", {categories});
  } catch (error) {
    console.error(error);
    next(error);
  }
}





// adding product
module.exports.postProduct = async (req, res,next) => {
  try {
    if (req.files) {
      const productImg = req.files;
      let croppedImages = [];

      for (const element of productImg) {
        const filePath = `uploads/cropperd_${element.originalname}`;
        const cropped = await sharp(element.path)
          .resize({ width: 300, height: 300, fit: 'cover' })
          .toFile(filePath);
          croppedImages.push({ path: filePath });
        console.log(filePath);
      }

      const imageIds = croppedImages.map((productImg) => productImg.path);
      console.log("IMAGE ID" + imageIds);

      await productCollection.create({
        productName: req.body.productName,
        productDiscription: req.body.productDiscription,
        productCategory: req.body.productCategory,
        productBrand: req.body.productBrand,
        regularPrice: req.body.regularPrice,
        sellingPrice: req.body.sellingPrice,
        productSize: req.body.productSize,
        productStock: req.body.productStock,
        productStatus: req.body.productStatus,
        productImg: imageIds,
      });

      const productdata = await productCollection.find();
      res.render("admin-productlist", { productdata });
      console.log(imageIds);
    } else {
      res.status(400).send("No images selected for upload");
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
};


// delete a product
module.exports.deleteProduct = async(req,res,next) => {
  try{
    const productId = req.params.productId;
    console.log(productId)
    const result = await productCollection.deleteOne({_id:productId})
    if(result.deletedCount === 1) {
      res.redirect("/admin/product-list")
    } else {
      res.status(404).send("Category not found")
    }
  } catch(error) {
    console.error(error);
    next(error);
  }
}

// render product edit page
module.exports.editProduct = async(req,res,next) => {
  try{
    const product = req.params.productId;
    const productdata = await productCollection.findOne({_id:product})
    const categorydata = await categoryCollection.find();
    res.render("admin-editproduct", {productdata, categorydata})
  } catch (error) {
    console.log(error);
    next(error);
  }
}


//saving edited details into the db
module.exports.updateProduct = async (req, res) => {
  try {
    const editId = req.params.productId;
    const existingProduct = await productCollection.findById(editId);

    const {
      productName,
      productDiscription,
      productCategory,
      productBrand,
      regularPrice,
      sellingPrice,
      productSize,
      productStock,
      productStatus,
    } = req.body;

    const newproductImg = req.files;
    const croppedImages = [];

    // Existing images
    const existingImages = existingProduct.productImg;

    // Process new images with sharp and add to the array
    if (newproductImg) {
      for (const element of newproductImg) {
        const filePath = `uploads/cropperd_${element.originalname}`;
        const cropped = await sharp(element.path)
          .resize({ width: 300, height: 300, fit: 'cover' })
          .toFile(filePath);
          croppedImages.push(filePath);
      }
    }

    // Combine existing and new image paths
    const updatedProductImg = [...existingImages, ...croppedImages];

    const updatedData = {
      productName,
      productDiscription,
      productCategory,
      productBrand,
      regularPrice,
      sellingPrice,
      productSize,
      productStock,
      productStatus,
      productImg: updatedProductImg,
    };

    const updatedProduct = await productCollection.findByIdAndUpdate(editId, updatedData, { new: true });
    const successMessage = "Product updated successfully";
    res.redirect('/admin/product-list');
  } catch (error) {
    console.log(error);
    res.redirect("/admin/edit-product", { error: "An error occurred while updating the product, please try again" });
  }
};



// block product
module.exports.blockProduct = async (req,res,next) => {
  try {
    Idproduct = req.params.productId
    const newStatus = await productCollection.findById({_id: Idproduct})
    const updatedStatus = await productCollection.updateOne({_id: Idproduct}, {$set: {productStatus: "Block"}})
    res.redirect('/admin/product-list')
  } catch (error) {
    console.error(error);
    next(error);
  }
}

// Unblock product
module.exports.unblockProduct = async (req,res,next) => {
  try {
    Idproduct = req.params.productId
    const newStatus = await productCollection.findById({_id: Idproduct})
    const updatedStatus = await productCollection.updateOne({_id: Idproduct}, {$set: {productStatus: "Unblock"}})
    res.redirect('/admin/product-list')
  } catch (error) {
    console.error(error)
    next(error);
  }
}


// delete image
module.exports.deleteImage = async (req, res,next) => {
  try {
    const productId = req.query.productId;
    const imagepath = req.query.image;

    console.log('Deleting Image:', imagepath);

    await productCollection.updateOne({ _id: productId }, { $pull: { productImg: imagepath } });

    

    // Render the view with the updated product data
    const productdata = await productCollection.findOne({ _id: productId });
    const categorydata = await categoryCollection.find({});
    res.render("admin-editproduct", { productdata, categorydata });
  } catch (error) {
    console.error(error);
    // res.status(500).send('Internal Server Error');
    next(error);
  }
};