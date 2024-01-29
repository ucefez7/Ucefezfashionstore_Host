const mongoose = require("mongoose")
const orderCollection = require("../../models/order")



module.exports.salesReport = async(req,res) =>{
    try {
        const orderData = await orderCollection.find({ orderStatus : "Delivered"});
        res.render("admin-salesReport",{orderData})
    } catch (error) {
        console.log(error)     
        next(error);   
    }
}




module.exports.filterSales = async (req, res, next) => {
  try {
      const startDate = req.body.startDate ? new Date(req.body.startDate) : null;
      const endDate = req.body.endDate ? new Date(req.body.endDate) : null;

      if (!startDate && !endDate) {
          const orderData = await orderCollection.find({ orderStatus: "Delivered" });
          res.render("admin-salesReport", { orderData });

      } else if (!endDate) {   
          const orderData = await orderCollection.find({
              orderStatus: "Delivered",
              orderDate: { $gte: startDate },
          });
          res.render("admin-salesReport", { orderData });

      } else { 
          const orderData = await orderCollection.find({
              orderStatus: "Delivered",
              orderDate: { $gte: startDate, $lte: endDate },
          });
          res.render("admin-salesReport", { orderData });
      }
  } catch (error) {
      console.log(error);
      next(error);
  }
};


