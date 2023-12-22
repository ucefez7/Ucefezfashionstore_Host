const userCollection = require("../../models/user_schema");
const productCollection = require("../../models/product");
const cartCollection = require("../../models/cart")

require('dotenv').config();
const jwt = require("jsonwebtoken");
const { default: mongoose } = require("mongoose");
const secretkey = process.env.JWT_SECRET_KEY

// render cart page
module.exports.getCart = async (req, res) => {
  try {
    
    const userData = await userCollection.findOne({ email: req.user });
    const userName = userData.username
    const userId = userData._id;

    const loggedIn = req.cookies.loggedIn;
    const username = req.cookies.username;

    const cartDetails = await cartCollection.findOne({ userId: userId }).populate('products.productId') ;
    res.render("user-cart", { loggedIn, username, cartDetails });
    
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};  





// add cart
module.exports.addCart = async(req,res) => {
  try{
     const userData = await userCollection.findOne({email: req.user})
     const userId = userData._id;
     const productId = req.query.productId;
     

     console.log("Product ID:", productId);

     
     let userCart = await cartCollection.findOne({userId});
     if (!userCart) {
      userCart = new cartCollection({
        userId,
        products: [],
      });
     }

     const existingProductIndex = userCart.products.findIndex(
      (product) => product.productId.toString() === productId
     );

     if(existingProductIndex !== -1) {
      userCart.products[existingProductIndex].quantity += 1;
     } else {
      userCart.products.push({
        productId: new mongoose.Types.ObjectId(productId),
        quantity: 1,
      });
     }

     await userCart.save();

     res.json({message: "Product added to the cart"});
  } catch(error) {
    console.log("Error adding to the cart:", error);
    res.status(500).json({error: "Failed to add the product to cart"});
  }
}








// delete a product from cart
module.exports.deleteCart = async (req, res) => {
  try {
    const productId = req.query.productId;
    const userData = await userCollection.findOne({ email: req.user });
    const userId = userData._id;

    // Assuming you have a product schema with a field _id
    const productObjectId = new mongoose.Types.ObjectId(productId);

    const result = await cartCollection.updateOne(
      { userId: userId },
      { $pull: { products: { _id: productObjectId } } }
    );
    if (result.nModified === 1) {
      console.log('Product removed from the cart');
      res.status(200).redirect("/cart");
    } else {
      console.log('Product not found in the user\'s cart');
      res.redirect("/cart");
    }

  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};







module.exports.manageQuantity = async(req,res) => {
  try {
    const {productId,newQuantity} = req.query;
    const userData = await userCollection.findOne({ email: req.user });
    const userId = userData._id;
    const cart = await cartCollection.findOne({userId: userId})
    
    for (const item of cart.products){
      if(item._id == productId){
        await cartCollection.updateOne(
          {userId: userId, "products._id": productId},
          {$set: {"products.$.quantity": newQuantity}}
        );
      }
    }
    if(cart) {
      // const subtotal = cart.products.sellingPrice * cart.quantity
      // console.log(cart)
      res.json({success: true})
    }else{
      res.json({success: false, error: "Item not found in the cart"})
    }
  } catch(error){
    console.error(error)
  }
}


// subtotal 
module.exports.subtotal = async (req, res) => {
  try {
    const userData = await userCollection.findOne({ email: req.user });
    const userId = userData._id;
    const cart = await cartCollection.findOne({ userId: userId });

    let subtotal = 0;
    let isStockAvailable = true;

    // Iterate through products and calculate subtotal
    for (const productItem of cart.products) {
      const product = await productCollection.findById(productItem.productId);

      // Check if the quantity is less than or equal to the product stock
      if (productItem.quantity > product.productStock) {
        isStockAvailable = false;
      } else {
        // Calculate subtotal only if the product is in stock
        subtotal += product.sellingPrice * productItem.quantity;
      }
    }

    // Return the subtotal and stock availability as JSON
    res.json({ success: true, subtotal, isStockAvailable });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};