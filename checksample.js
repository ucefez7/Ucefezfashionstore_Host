const userCollection = require("../../models/user_schema");
const productCollection = require("../../models/product");
const cartCollection = require("../../models/cart");
const addressCollection = require("../../models/address");
const { subtotal } = require("./cartdetails");
const orderCollection = require("../../models/order");

const Razorpay = require("razorpay")
const { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY}= process.env
const instance = new Razorpay({
  key_id: RAZORPAY_ID_KEY,
  key_secret: RAZORPAY_SECRET_KEY,
})

// render checkout
module.exports.getCheckout = async (req, res) => {
  try {
    const loggedIn = req.cookies.loggedIn;
    const username = req.cookies.username;

    const userData = await userCollection.findOne({ email: req.user });
    const userId = userData._id;
    const cartDetails = await cartCollection.findOne({ userId: userId }).populate("products.productId");
    const addressDetails = await addressCollection.findOne({userId: userId})

    // Check if productStock is sufficient for each product in the cart
    const stockCheck = cartDetails.products.every(productItem => {
      return productItem.productId.productStock >= productItem.quantity;
    });

    if (!stockCheck) {
      // Redirect to cart if productStock is insufficient
      return res.redirect('/cart');
    }

    res.render("user-checkout", { loggedIn, username, cartDetails, subtotal, addressDetails });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

// grandtotal amount
module.exports.grandtotal = async (req, res) => {
  try {
    const userData = await userCollection.findOne({ email: req.user });
    const userId = userData._id;
    const cartDetails = await cartCollection
      .findOne({ userId: userId })
      .populate("products.productId");

    let subtotal = 0;
    for (const productitem of cartDetails.products) {
      const product = await productCollection.findById(productitem.productId);
      subtotal += product.sellingPrice * productitem.quantity;
    }

    res.json({ success: true, subtotal });
  } catch (error) {
    console.error(error);
    // res.status(500).json({ success: false, error: "Internal server error" });
    next(error);
  }
};





// cash on delivery
module.exports.cashOnDelivery = async (req, res) => {
  try {
    const userData = await userCollection.findOne({ email: req.user });
    const userId = userData._id;
    const cartDetails = await cartCollection.findOne({ userId: userId }).populate('products.productId');

    // Check if productStock is sufficient for each product in the cart
    const stockCheck = cartDetails.products.every(productItem => {
      return productItem.productId.productStock >= productItem.quantity;
    });

    if (!stockCheck) {
      // Redirect to cart if productStock is insufficient
      return res.redirect('/cart');
    }

    let totalAmount = 0;

    const orderProducts = await Promise.all(cartDetails.products.map(async (productItem) => {
      const product = await productCollection.findById(productItem.productId);
      totalAmount += product.sellingPrice * productItem.quantity;

      // Update productStock
      product.productStock -= productItem.quantity;
      await product.save();

      return {
        productId: productItem.productId,
        price: product.sellingPrice,
        quantity: productItem.quantity,
      };
    }));

    const paymentMethod = 'Cash On Delivery';
    const addressId = req.query.selectedAddresses;
    const address = await addressCollection.findOne({ userId: userId, 'address._id': addressId }, { 'address.$': 1 });

    const userOrder = await orderCollection.create({
      userId,
      products: orderProducts,
      totalAmount,
      paymentMethod,
      address,
    });

     // Delete products from cart
     await cartCollection.findOneAndDelete({ userId: userId })

    res.status(200).json({ message: "order placed" });
  } catch (error) {
    console.log('Error:', error);
    res.status(500).render('error');
  }
};


// render place order
module.exports.getPlaceOrder = async(req,res) => {
  try{
    const loggedIn = req.cookies.loggedIn;
    const username = req.cookies.username;
    res.render("user-orderplaced",{loggedIn,username})
  }catch(error){
    console.error("error: ", error)
    next(error);
  }
}