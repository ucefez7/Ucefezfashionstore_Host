const mongoose = require("mongoose");
const multer = require("multer");
//const {uploads} = require("../multer-middleware/multer_middleware")

const userCollection = require("../../models/user_schema")


// // user manage page
// module.exports.getUsers = async(req,res,next) => {
//   try {
//     const usercollection = await userCollection.find()
//     res.render("admin-usermanage", {usercollection})
//   } catch(error) {
//     console.error(error)
//     next(error);
//   }
// }

// user manage page
module.exports.getUsers = async(req,res,next) => {
  try {
    let perPage = 5;
    let page = req.query.page || 1;
    const usercollection = await userCollection.find()
    .sort({ createdAt: -1 })
          .skip(perPage * page - perPage)
          .limit(perPage)
          .exec();
          usercollection.reverse();
        const count = await userCollection.countDocuments({});

    res.render("admin-usermanage", {usercollection, current: page, pages: Math.ceil(count / perPage)});
  } catch(error) {
    console.error(error)
    next(error);
  }
}




// block user
module.exports.blockUser = async(req,res,next) => {
  try {
    const Iduser = req.params.userId
    const newStatus = await userCollection.findById({_id:Iduser})
    const updatedStatus = await userCollection.updateOne({_id:Iduser},{$set:{status:"Block"}})
    res.redirect("/admin/user-manage") 
  } catch (error) {
    console.error(error)
    next(error);
  }
}

// unblock user
module.exports.unblockUser = async(req,res,next) => {
  try {
    const Iduser = req.params.userId
    const newStatus = await userCollection.findById({_id:Iduser})
    const updatedStatus = await userCollection.updateOne({_id:Iduser},{$set:{status:"Unblock"}})
    res.redirect("/admin/user-manage") 
  } catch (error) {
    console.error(error)
    next(error);
  }
}