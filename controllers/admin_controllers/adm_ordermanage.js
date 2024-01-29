const mongoose = require("mongoose")
const orderCollection = require("../../models/order");
const userCollection = require("../../models/user_schema");
const productCollection = require("../../models/product");




// module.exports.getOrderlist = async(req,res) => {
//   try{
//     const orderDetails = await orderCollection.find().populate('products.productId').populate('userId');
//     res.render("admin-orderlist",{ orderDetails})
//   }catch (error) {
//     console.error("Error:", error)
//   }
// }

module.exports.getOrderlist = async(req,res) => {
  try{
    const page = req.query.page ? parseInt(req.query.page, 10) : 1;
    const limit = 9;
    const orderDetails = await orderCollection.find().populate('products.productId').populate('userId').aggregate([
      {
        $skip: (page - 1) * limit,
      },
      {
        $limit: limit,
      },
    ])
    .exec();
    res.render("admin-orderlist",{ orderDetails})
  }catch (error) {
    console.error("Error:", error)
  }
}



// render order details page
module.exports.getOrdermanage = async(req,res,next) => {
  try{
    const orderId = req.params.orderId
    const orderDetails = await orderCollection.findById({_id: orderId}).populate('products.productId').populate('userId');;
    res.render("admin-ordermanage",{ orderDetails })
  }catch (error) {
    console.error("Error:", error)
    next(error);
  }
}


// dispatch order
module.exports.dispatchOrder = async (req, res,next) => {
  try {
    const orderId = req.query.orderId;
    const orderData = await orderCollection.findById(orderId);

    if (orderData.orderStatus !== "Order Placed") {
      return res.status(400).json({ error: "Order has already been shipped or cancelled" });
    }
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
    // res.status(500).json({ error: "Internal Server Error" });
    next(error);
  }
};


// deliver order
module.exports.deliverOrder = async (req, res,next) => {
  try {
    const orderId = req.query.orderId;
    const orderData = await orderCollection.findById(orderId);

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
    next(error);
  }
};




//cancel order
module.exports.cancelOrder = async (req, res,next) => {
  try {
    const orderId = req.query.orderId;
    const productId = req.query.productId;
    const orderData = await orderCollection.findById(orderId);

    const productInOrder = orderData.products.find(
      (product) => product.productId.equals(productId)
    );

    if (productInOrder) {
      const product = await productCollection.findById(productId);
      product.productStock += productInOrder.quantity;
      await product.save();

      orderData.products = orderData.products.filter(
        (product) => !product.productId.equals(productId)
      );

      await orderData.save();

      res.status(200).json({ message: "The product is cancelled" });
    } else {
      res.status(404).json({ error: "Product not found in the order" });
    }
  } catch (error) {
    console.error("Error:", error);
    // res.status(500).json({ error: "Internal server error" });
    next(error);
  }
};


