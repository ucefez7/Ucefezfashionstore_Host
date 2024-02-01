const mongoose = require("mongoose");
const multer = require("multer");
//const {uploads} = require("../multer-middleware/multer_middleware")

const categoryCollection = require("../../models/category");
const productCollection = require("../../models/product");


// // render category page with data
// module.exports.getCategory = async (req, res, next) => {
//   try {
//       const categories = await categoryCollection.find();
//       res.render("admin-categorylist", { categories });
//   } catch (error) {
//       console.error(error);
//       next(error);
//   }
// };

// render category page with data
module.exports.getCategory = async (req, res, next) => {
  try {
    let perPage = 5;
    let page = req.query.page || 1;
      const categories = await categoryCollection.find()
      .sort({ createdAt: -1 })
          .skip(perPage * page - perPage)
          .limit(perPage)
          .exec();
          categories.reverse();
        const count = await categoryCollection.countDocuments({});

      res.render("admin-categorylist", { categories, current: page, pages: Math.ceil(count / perPage)});
  } catch (error) {
      console.error(error);
      next(error);
  }
};


// adding catagory data
module.exports.postCategory = async (req, res, next) => {
  try {
    const catgName = req.body.catgName;
    const categorydata = await categoryCollection.findOne({ catgName: catgName });
    if (categorydata) {
      res.status(409).json({ success: false, message: 'Category already exists' });
    } else {
      await categoryCollection.create({
        catgName: catgName,
        catgDiscription: req.body.catgDiscription,
        categoryStatus: "Unblock",
      });
      const categories = await categoryCollection.find();
      res.status(201).json({ success: true, message: 'Category added successfully', categories });
    }
  } catch (error) {
    console.error(error);
    next(error);
    // res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// render edit category data page
module.exports.editCategory = async (req,res) => {
  const category=req.params.categoryId
  const categorydata = await categoryCollection.findById({_id:category})
  res.render("admin-editcategory",{categorydata})
}

// // update category
// module.exports.updateCategory = async(req,res,next) => {
//   try {
//     const categoryId = req.params.categoryId;
//     // console.log(categoryId)
//     const catagory = await categoryCollection.findById(categoryId);

//     const catgName = req.body.catgName;
//     const categorydata = await categoryCollection.findOne({ catgName: catgName });
//     if (categorydata) {
//       res.status(409).json({ success: false, message: 'Category already exists' });
//     } else {
//     catagory.catgName = req.body.catgName;
//     catagory.catgDiscription = req.body.catgDiscription;
//     await catagory.save();
//     }

//     // res.render("admin-editcategory")
//     res.redirect("/admin/category-list")
//   } catch (error) {
//     console.error(error);
//     next(error);
//   }
// }


module.exports.updateCategory = async (req, res, next) => {
  try {

    console.log("Fetch");
    const categoryId = req.params.categoryId;
    const catagory = await categoryCollection.findById(categoryId);

    const catgName = req.body.catgName;
    const categorydata = await categoryCollection.findOne({ catgName: catgName });
    if (categorydata) {
      return res.status(409).json({ success: false, message: 'Category already exists' });
    } else {
      catagory.catgName = req.body.catgName;
      catagory.catgDiscription = req.body.catgDiscription;
      await catagory.save();
      res.status(201).json({ success: true, message: 'Category edited successfully'});
    }

    res.redirect("/admin/category-list");
  } catch (error) {
    console.error(error);
    next(error);
  }
};



// delete category
// module.exports.deleteCategory = async(req,res) => {
//   try {
//     const catagoryId = req.params.categoryId;
//     console.log(catagoryId)
//     const result = await categoryCollection.deleteOne({_id:catagoryId});

//     if(result.deletedCount === 1) {
//       res.redirect("/admin/category-list")
//     } else {
//       res.status(404).send("Category not found")
//     }
//   } catch (error) {
//     console.error(error);
//   }
// }


// block category
module.exports.blockCategory = async (req,res,next) => {
  try {
    Idcategory = req.params.categoryId
    console.log(Idcategory)
    const newStatus = await categoryCollection.findById({_id: Idcategory})
    const updatedStatus = await categoryCollection.updateOne({_id: Idcategory}, {$set: {categoryStatus: "Block"}})
    res.redirect('/admin/category-list')
  } catch (error) {
    console.error(error)
    next(error);
  }
}


// unblock category
module.exports.unblockCategory = async (req,res,next) => {
  try {
    Idcategory = req.params.categoryId
    const newStatus = await categoryCollection.findById({_id: Idcategory})
    const updatedStatus = await categoryCollection.updateOne({_id: Idcategory}, {$set: {categoryStatus: "Unblock"}})
    res.redirect('/admin/category-list')
  } catch (error) {
    console.error(error)
    next(error);
  }
}