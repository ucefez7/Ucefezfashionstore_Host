// return order
module.exports.returnOrder = async (req, res) => {
    try {
      console.log("return adikoda nee")
      console.log(req.body)
      const userData = await userCollection.findOne({ email: req.user });
      const userId = userData._id;
      const orderId = req.query.orderId;
      const returnReason = req.query.reason;
      const orderData = await orderCollection.findById(orderId);
      const deliveryDate = orderData.deliveryDate;
      const productIds = orderData.products.map((product) => product.productId);
      const productData = await productCollection.find({
        _id: { $in: productIds },
      });
  
      const totalProductAmount = orderData.products
        .filter((product) => product.status !== "Cancelled")
        .reduce((total, product) => total + product.orderPrice, 0);
  
  
        console.log("totalProductAmount: " +totalProductAmount)
  
      for (const product of productData) {
        const orderProduct = orderData.products.find((orderProduct) =>
          orderProduct.productId.equals(product._id)
        );
        product.productStock += orderProduct.quantity;
        await product.save();
      }
  
      orderData.products.forEach((product) => {
        if (product.status == "Delivered") {
          product.status = "Returned";
        }
      });
      await orderData.save();
  
      // save the order status
      orderData.orderStatus = "Returned";
      orderData.paymentStatus = "Repayed";
      orderData.returnReason = returnReason;
      await orderData.save();
  
      const userWallet = await walletCollection.findOne({ userId: userId });
      const walletAmount = userWallet.amount ?? 0;
      
      console.log("walletAmount: " +walletAmount)
  
      
      const totalOrderAmount = totalProductAmount ?? 0;
  
      console.log("totalOrderAmount: " +totalOrderAmount)
  
      const newWalletAmount = walletAmount + totalOrderAmount;
      
  
      if (orderData.paymentStatus == "Success") {
        await walletCollection.updateOne(
          { userId: userId },
          { $set: { amount: newWalletAmount } }
        );
        // walletAmount = newWalletAmount;
      }
  
      console.log("newWalletAmount: " +newWalletAmount)
  
      res.status(200).json({ message: "The order is Returned" });
    } catch (error) {
      console.error("Error: ", error);
      res.status(500).json({ error: "Error found while returning product" });
    }
  };