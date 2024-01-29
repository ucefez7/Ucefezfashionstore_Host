const userCollection = require("../../models/user_schema");
const productCollection = require("../../models/product");
const cartCollection = require("../../models/cart")
const offerController = require("../admin_controllers/adm_offermanage");
require('dotenv').config();
const jwt = require("jsonwebtoken");
const { default: mongoose } = require("mongoose");
const secretkey = process.env.JWT_SECRET_KEY

// render cart page
module.exports.getCart = async (req, res) => {
  try {
    await offerController.deactivateExpiredOffers();
    const userData = await userCollection.findOne({ email: req.user });
    const userId = userData._id;
    const username = userData.username;

    const loggedIn = req.cookies.loggedIn;
    const productOffers = await productCollection.find({
      discountStatus: "Active",
    });
    const cartDetails = await cartCollection
      .findOne({ userId: userId })
      .populate("products.productId");
    res.render("user-cart", { loggedIn, username, cartDetails, productOffers });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
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
module.exports.deleteCart = async (req, res,next) => {
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
    // res.status(500).send('Internal Server Error');
    next(error);
  }
};

module.exports.manageQuantity = async(req,res,next) => {
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
      
      res.json({success: true})
    }else{
      res.json({success: false, error: "Item not found in the cart"})
    }
  } catch(error){
    console.error(error)
    next(error);
  }
}


module.exports.subtotal = async (req, res) => {
  try {
    const userData = await userCollection.findOne({ email: req.user });
    const userId = userData._id;
    const cart = await cartCollection.findOne({ userId: userId });
    const productOffers = await productCollection.find({
      discountStatus: "Active",
    });

    let subtotal = 0;
    let isStockAvailable = true;

    if (cart) {
      for (const productItem of cart.products) {
        const product = await productCollection.findById(productItem.productId);

        if (productItem.quantity > product.productStock) {
          isStockAvailable = false;
        } else {
          subtotal += product.sellingPrice * productItem.quantity;

          // Check if the product has a discount offer
          const matchingOffer = productOffers.find(
            (offer) => offer.productName === product.productName
          );

          if (matchingOffer) {
            const discountedAmount =
              (productItem.quantity *
                (product.sellingPrice * matchingOffer.discountPercent)) /
              100;

            // Ensure that discountedAmount is a valid number
            if (!isNaN(discountedAmount)) {
              subtotal -= discountedAmount;
              console.log("discountedAmount", discountedAmount);
            }
          }
        }
      }
      console.log("subtotal", subtotal);
      res.json({ success: true, subtotal, isStockAvailable });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};



module.exports.stockchecking = async(req,res) =>{
  try {
    const userData = await userCollection.findOne({ email: req.user });
    const userCart = await cartCollection.findOne({ userId: userData.id }).populate({path: "products.productId",model: productCollection,});
     if (userCart && userCart.products.length > 0) {
       const hasZeroStock = userCart.products.some(
         (product) => product.productId.productStock === 0
       );

       if (hasZeroStock) {
          res.status(400).json({ message: "Some products in your cart are out of stock." });
       } else {
         res.redirect("/checkout");
       }
     } else {
       res.status(400).send("Your cart is empty.");
     }
  } catch (error) {
    console.log(error);
    next(error);
  }
}