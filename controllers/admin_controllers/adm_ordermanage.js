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


module.exports.dispatchOrder = async(req,res) => {
  try{
    const orderId = req.query.orderId
    const orderData = await orderCollection.findById(orderId)

    orderData.orderStatus = "Shipped";
    await orderData.save();

    res.status(200).json({message: "The order is shipped"})
  }catch(error){
    console.error("Error:", error)
  }
}



module.exports.deliverOrder = async(req,res) => {
  try{
    const orderId = req.query.orderId
    const orderData = await orderCollection.findById(orderId)

    orderData.orderStatus = "Delivered";
    await orderData.save();

    res.status(200).json({message: "The order is delivered"})
  }catch(error){
    console.error("Error:", error)
  }
}



module.exports.cancelOrder = async(req,res) => {
  try{
    const orderId = req.query.orderId;
    const orderData = await orderCollection.findById(orderId);
    const productIds = orderData.products.map((product) => product.productId);
    const productData = await productCollection.find({_id: { $in: productIds }});


    for(const product of productData) {
      const orderProduct = orderData.products.find((orderProduct) => 
        orderProduct.productId.equals(product._id)
      );

      product.productStock += orderProduct.quantity;

      await product.save();
    }

    orderData.orderStatus = "Cancelled";
    await orderData.save();

    res.status(200).json({message: "The order is cancelled"})
    
  } catch(error){
    console.error("Error:", error)
    res.status(500).json({error: "Error found while cancelling product"});
  }
}