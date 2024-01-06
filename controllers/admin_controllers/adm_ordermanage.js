const mongoose = require("mongoose")
const orderCollection = require("../../models/order");
const userCollection = require("../../models/user_schema");
const productCollection = require("../../models/product");

// render order manage page
module.exports.getOrderlist = async(req,res) => {
  try{
    const orderDetails = await orderCollection.find().populate('products.productId').populate('userId');
    res.render("admin-orderlist",{ orderDetails})
  }catch (error) {
    console.error("Error:", error)
  }
}

// render order details page
module.exports.getOrdermanage = async(req,res) => {
  try{
    const orderId = req.params.orderId
    const orderDetails = await orderCollection.findById({_id: orderId}).populate('products.productId').populate('userId');;
    res.render("admin-ordermanage",{ orderDetails })
  }catch (error) {
    console.error("Error:", error)
  }
}



// dispatch order
module.exports.dispatchOrder = async (req, res) => {
  try {
    const orderId = req.query.orderId;
    const orderData = await orderCollection.findById(orderId);

    if (orderData.orderStatus !== "Order Placed") {
      return res.status(400).json({ error: "Order has already been shipped or cancelled" });
    }

    // Update the status of each product in the order
    for (const product of orderData.products) {
      if (product.status === "Order Placed") {
        product.status = "Shipped";

        
      }
    }

    orderData.orderStatus = "Shipped";
    await orderData.save();

    res.status(200).json({ message: "The order is shipped" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// deliver order
module.exports.deliverOrder = async (req, res) => {
  try {
    const orderId = req.query.orderId;
    const orderData = await orderCollection.findById(orderId);

    // Update the status of each product in the order
    for (const product of orderData.products) {
      if (product.status === "Shipped") {
        product.status = "Delivered";

      }
    }
    orderData.orderStatus = "Delivered";
    orderData.paymentStatus = "Success";
    orderData.deliveryDate = Date.now();

    const expiryDate = new Date(orderData.deliveryDate);
    expiryDate.setDate(expiryDate.getDate() + 2);

    orderData.expiryDate = expiryDate;

    await orderData.save();

    res.status(200).json({ message: "The order is delivered" });
  } catch (error) {
    console.error("Error:", error);
  }
};







// Update cancelOrder controller
module.exports.cancelOrder = async (req, res) => {
  try {
    const orderId = req.query.orderId;
    const productId = req.query.productId;
    const orderData = await orderCollection.findById(orderId);

    // Find the corresponding product in the order
    const productInOrder = orderData.products.find(
      (product) => product.productId.equals(productId)
    );

    if (productInOrder) {
      // Update productStock based on the order quantity
      const product = await productCollection.findById(productId);
      product.productStock += productInOrder.quantity;
      await product.save();

      // Remove the product from the order
      orderData.products = orderData.products.filter(
        (product) => !product.productId.equals(productId)
      );

      // Save the updated order
      await orderData.save();

      res.status(200).json({ message: "The product is cancelled" });
    } else {
      res.status(404).json({ error: "Product not found in the order" });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};



