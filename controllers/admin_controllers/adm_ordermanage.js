const mongoose = require("mongoose")
const orderCollection = require("../../models/order");
const userCollection = require("../../models/user_schema");
const productCollection = require("../../models/product");



// // render order manage page pagination done
// module.exports.getOrderlist = async (req, res, next) => {
//   try {
//       const page = parseInt(req.query.page) || 1;
//       const pageSize = 5;
//       const skip = (page - 1) * pageSize;

//       let searchQuery = {};
//       const searchParam = req.query.search;
//       if (searchParam) {
//           // If a search parameter is provided, search by order ID or user name
//           searchQuery = {
//               $or: [
//                   { _id: { $regex: new RegExp(searchParam, 'i') } }, // Case-insensitive search for order ID
//                   { 'userId.username': { $regex: new RegExp(searchParam, 'i') } } // Case-insensitive search for user name
//               ]
//           };
//       }

//       const orderDetails = await orderCollection
//           .find(searchQuery)
//           .populate('products.productId')
//           .populate('userId')
//           .skip(skip)
//           .limit(pageSize)
//           .exec();

//       const totalCount = await orderCollection.countDocuments(searchQuery);
//       const totalPages = Math.ceil(totalCount / pageSize);

//       res.render("admin-orderlist", {
//           orderDetails,
//           currentPage: page,
//           totalPages,
//       });
//   } catch (error) {
//       console.error("Error:", error);
//       next(error);
//   }
// };






module.exports.getOrderlist = async(req,res) => {
  try{
    const orderDetails = await orderCollection.find().populate('products.productId').populate('userId');
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
    // res.status(500).json({ error: "Internal Server Error" });
    next(error);
  }
};

// deliver order
module.exports.deliverOrder = async (req, res,next) => {
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
    next(error);
  }
};







// Update cancelOrder controller
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
    // res.status(500).json({ error: "Internal server error" });
    next(error);
  }
};



