const productCollection = require("../../models/product");
const orderCollection = require("../../models/order");
const userCollection = require("../../models/user_schema");
const categoryCollection = require("../../models/category");

module.exports.getAdminDashboard = async (req, res) => {
try {
  // Check if a token exists in the request cookies
    if (req.cookies.token) {
      // Fetch order details along with user information
    const orderDetails = await orderCollection.find().populate({ path : "userId" , model : userCollection})

     // Aggregate total sales with a match on paymentStatus: "Success"
    const totalSales = await orderCollection.aggregate([{ $match : {paymentStatus : "Success"}},{$group : {_id : null ,totalAmount : {$sum : "$totalAmount"}}}]) 


    // Fetch total number of orders, products, categories, and users
    const totalOrders = await orderCollection.find()
    const totalProducts = await productCollection.find();
    const totalCategories = await categoryCollection.find();
    const users = await userCollection.find();

     // Compile statistics object
    const statistics = {
      totalSales,
      totalOrders: totalOrders.length,
      totalProducts: totalProducts.length,
      totalCategories: totalCategories.length,
      totalUsers: users.length,
    };
   

    // Aggregate data for cancelled, returned, and all orders per month
    const cancelData = await orderCollection.aggregate([{$unwind: "$products" // Unwind the products array to access individual items
      },
      {$match: {"products.status": "Cancelled" // Match based on the status property within the products array
        }},
      {$group: {_id: { $month: "$orderDate" },count: { $sum: 1 } }},
      { $project: {_id: 1,count: { $ifNull: ["$count", 0] }}}]);
    
    const returnData = await orderCollection.aggregate([{$match : {orderStatus : "Returned"}},{$group:{_id:{ $month : '$orderDate'}, count : {$sum : 1}}},{$project:{_id : 1,count:{$ifNull:['$count',0]}}}])
    const orderData = await orderCollection.aggregate([{$group:{_id:{ $month : '$orderDate'}, count : {$sum : 1}}},{$project:{_id : 1,count:{$ifNull:['$count',0]}}}])
    
    // Fill data with zeroes for missing months
    const filledOrderData = fillDataWithZeroes(orderData);
    const filledCancelData = fillDataWithZeroes(cancelData);
    const filledReturnData = fillDataWithZeroes(returnData);
    console.log('Statistics:', statistics);

 // Define a function to fill missing months with zero count
    function fillDataWithZeroes(data) {
        const labels = Array.from({ length: 12 }, (_, index) => index + 1);
        return labels.map((month) => {
        const existingMonth = data.find((item) => item._id === month);
        return {
            _id: month,
            count: existingMonth ? existingMonth.count : 0,
        };
        }); 
    }


     // Define starting month and generate labels for the chart
    const startingMonth = 11;
    const labels = Array.from({ length: 12 }, (_, index) => (index + startingMonth) % 12 + 1);
     // Prepare data for the chart
    const chartFeeder = {
    orderData: filledOrderData,
    cancelData: filledCancelData,
    returnData: filledReturnData,
    };
     res.render("admin-dashboard", { orderDetails, statistics, chartFeeder: JSON.stringify(chartFeeder) });
     }else {
       // If no token is present, render the admin login page
       res.render("admin-login");
     }
        
} catch (error) {
 console.log(error)  
 next(error);
}    
};
