// razorpay order
module.exports.razorpayOrder = async (req, res) => {
    try {

      const userData = await userCollection.findOne({ email: req.user });
      const userId = userData._id;
      const addressId = req.body.selectedAddresses;
  
      
      // Check if productStock is sufficient for each product in the cart
      const stockCheck = cartDetails.products.every((productItem) => {
        return productItem.productId.productStock >= productItem.quantity;
      });
  
      const statusCheck = cartDetails.products.every((productItem) => {
        return productItem.productId.productStatus !== "Block";
      });
  
      if (!stockCheck || !statusCheck) {
        return res.redirect("/cart");
      }
  
      // Calculate total amount
      let totalAmount = 0;
      cartDetails.products.forEach((productItem) => {
        let product = productItem.productId;
        totalAmount += product.sellingPrice * productItem.quantity;
      });
  
      // Create Razorpay order
      var options = {
        amount: totalAmount * 100,
        currency: "INR",
        receipt: "order_rcptid_11",
      };
  
      console.log("Options:", options);
  
      instance.orders.create(options, function (err, order) {
        if (err) {
          console.error("Razorpay error:", err);
          return res
            .status(500)
            .json({ success: false, message: "Error creating order" });
        }
        console.log("Razorpay Order:", order);
        console.log("Total Amount:", totalAmount);
        res.status(200).json({
          success: true,
          message: "order placed",
          totalAmount: totalAmount.toFixed(2),
          addressId: addressId,
          order: order,
          orderId: order.id,
        });
      });
    } catch (error) {
      console.log("Error:", error);
      res.status(500).render("error");
    }
  };

  

  module.exports.razorpayOrderPlaced = async (req, res) => {
  try {
   
    const loggedIn = req.cookies.loggedIn;
    const userData = await userCollection.findOne({ email: req.user });
    const userId = userData._id;
    const username = userData.username;
    let totalAmount = 0;
    const addressId = req.query.addressId;

    

    // Calculate total amount
    cartDetails.products.forEach((productItem) => {
      let product = productItem.productId;
      totalAmount += product.sellingPrice * productItem.quantity;
    });

    // Create order in the database
    const paymentMethod = "Online payment";
    const paymentStatus = "Success";
    const orderProducts = cartDetails.products.map((productItem) => {
      let product = productItem.productId;
      let productTotalPrice = product.sellingPrice * productItem.quantity;

      // Update productStock
      product.productStock -= productItem.quantity;

      return {
        productId: productItem.productId,
        price: product.sellingPrice,
        quantity: productItem.quantity,
        orderPrice: isNaN(productTotalPrice)
          ? "0.00"
          : productTotalPrice.toFixed(2),
      };
    });

    // Create the order
    const userOrder = await orderCollection.create({
      userId,
      products: orderProducts,
      orderDate: new Date(),
      totalAmount,
      payableAmount: totalAmount,
      paymentMethod,
      paymentStatus,
      address,
    });

    // Delete products from cart
    await cartCollection.findOneAndDelete({ userId: userId });

    return res.render("user-orderplaced", { loggedIn, username });
  } catch (error) {
    console.log("Error:", error);
    return res.status(500).render("error");
  }
};
