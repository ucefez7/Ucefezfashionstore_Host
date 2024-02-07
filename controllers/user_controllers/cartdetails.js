const userCollection = require("../../models/user_schema");
const productCollection = require("../../models/product");
const cartCollection = require("../../models/cart")
const offerController = require("../admin_controllers/adm_offermanage");
require('dotenv').config();
const jwt = require("jsonwebtoken");
const { default: mongoose } = require("mongoose");
const secretkey = process.env.JWT_SECRET_KEY



module.exports.gettocart = async(req,res)=>{
  try{
    
      const userData = await userCollection.findOne({email : req.user})   
      const userId = userData.id;
      const { productId, quantity } = req.query; 
      const product = await productCollection.findOne({ _id: productId });
      if(product.productStock<=0){
        return res.status(200).json({error : "Product is out of stock", isProductAdded: false})
      }
      
      let userCart = await cartCollection.findOne({ userId })
      if(!userCart){
        userCart = new cartCollection({
            userId,
            products : [],
        })
      }
      const existingProductIndex = userCart.products.findIndex((product) =>product.productId.toString().toLowerCase() ===productId.toLowerCase());
      if(existingProductIndex !== -1){
        userCart.products[existingProductIndex].quantity += 1;
         await userCart.save();
      res.status(200).json({message: "Quantity increased in the cart",isProductAdded : true})
      }else{
        userCart.products.push({productId: new mongoose.Types.ObjectId(productId),quantity : 1})
         await userCart.save();
      res.status(200).json({message: "Added to the Cart",isProductAdded : true})
      }
     
      
  }catch(error){
      console.error("Error adding to cart:", error);
      res.status(500).json({
        error: "Login to add to cart",
        isProductAdded: false,
      });
  }
}
const calculateTotalPrice = (cart) => { 
let total = 0, newprice , subtotal;
for (const items of cart.products) {
  if ( items.productId.discountStatus === 'Active' && typeof items.productId.discountPercent === 'number'){
    newprice = items.productId.sellingPrice - (items.productId.sellingPrice * items.productId.discountPercent) / 100;
    subtotal = items.quantity * newprice;
    total += subtotal;  
  }else{
    subtotal = items.quantity * items.productId.sellingPrice;
    total += subtotal;    
  }

}

return total;
};


module.exports.getcart = async (req, res,next) => {
try {
  const loggedIn = req.cookies.loggedIn;
  console.log(loggedIn)
  await offerController.deactivateExpiredOffers(); 
  const userData = await userCollection.findOne({ email: req.user });
  const productOffers = await productCollection.find({discountStatus: "Active", });
  const userCart = await cartCollection.findOne({ userId: userData.id }).populate({path: "products.productId",model: productCollection,});
  const username = userData.username;
 
  
    if (!userCart || userCart.products.length === 0) {
      return res.render("user-cart", {loggedIn, userCart: null,grandtotal: 0, error: "Your cart is empty."});
    }
    grandtotal = calculateTotalPrice(userCart);
  res.render("user-cart", { loggedIn, userCart, username, grandtotal, productOffers ,error: null   });
} catch (error) {
  console.log(error);
  next(error);
} 
};

module.exports.updateQuantity = async (req,res) => {
try {
  const productId = req.body.productId;
  const newQuantity = req.body.quantity;
  const user = await userCollection.findOne({ email: req.user})
  await cartCollection.updateOne(
    { userId: user._id, "products._id": productId },
    { $set: { "products.$.quantity": newQuantity } }
  );
  const cart = await cartCollection.findOne({ userId: user._id }).populate({
    path: "products.productId",
    model: productCollection,
  });
  const updatedProduct = cart.products.find(
    (product) => product._id.toString() === productId.toString());
    
//calculating all amounts...
  var totalPrice = calculateTotalPrice(cart);
  var subTotal = updatedProduct.productId.sellingPrice * updatedProduct.quantity;
  const stock = updatedProduct.productId.productStock;
  if (newQuantity > updatedProduct.productId.productStock) {
     await cartCollection.updateOne(
       { userId: user._id, "products._id": productId },
       { $set: { "products.$.quantity": stock } }
     );
  }
  return res.status(200).json({
    newQuantity: updatedProduct.quantity,
    subTotal,
    stock,
    totalPrice,
  });


} catch (error) {
  console.log("error in updating quantity", error); 
  next(error);
} 
}



module.exports.removeFromCart = async(req,res)=>{
try {
   const user = await userCollection.findOne({ email: req.user }); 
  const productId = req.params.productId;
  await cartCollection.updateOne({ userId: user._id },{ $pull: {products: { productId: productId,}}});
  res.status(200).json({message : "Data removed successfully"})
} catch (error) {
  console.log(error);
  next(error);
}
}




