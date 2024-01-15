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


// module.exports.salesReport = async(req,res) =>{
//     try {
//         // Get today's date
//         const today = new Date();
//         today.setHours(0, 0, 0, 0); 

        
//         const orderData = await orderCollection.find({
//             orderStatus: "Delivered",
//             orderDate: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }, // Orders from today
//         });

//         res.render("admin-salesReport", { orderData });
//     } catch (error) {
//         console.log(error);
//         next(error);
//     }
// }





module.exports.filterSales = async (req, res, next) => {
  try {
      // Extracting start and end dates from the request body
      const startDate = req.body.startDate ? new Date(req.body.startDate) : null;
      const endDate = req.body.endDate ? new Date(req.body.endDate) : null;

      if (!startDate && !endDate) {
          // If no start or end date, retrieve all delivered orders
          const orderData = await orderCollection.find({ orderStatus: "Delivered" });
          res.render("admin-salesReport", { orderData });
      } else if (!endDate) {
          // If only start date, retrieve delivered orders after the start date
          const orderData = await orderCollection.find({
              orderStatus: "Delivered",
              orderDate: { $gte: startDate },
          });
          res.render("admin-salesReport", { orderData });
      } else {
          // If both start and end date, retrieve delivered orders within the date range
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


