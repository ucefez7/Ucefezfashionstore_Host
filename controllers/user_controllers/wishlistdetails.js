const userCollection = require("../../models/user_schema");
const productCollection = require("../../models/product");
const cartCollection = require("../../models/cart");
const wishlistCollection = require("../../models/wishlist");

require("dotenv").config();
const jwt = require("jsonwebtoken");
const { default: mongoose } = require("mongoose");
const secretkey = process.env.JWT_SECRET_KEY;

// render wishlist
module.exports.getWishlist = async (req, res) => {
  try {
    
    const userData = await userCollection.findOne({ email: req.user });
    const username = userData.username;
    const userId = userData._id;
    const loggedIn = req.cookies.loggedIn;
    const wishlistDetails = await wishlistCollection.findOne({ userId: userId }).populate("products.productId");

    res.render("user-wishlist", { loggedIn, username, wishlistDetails });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

// add product to wishlist
module.exports.addWishlist = async (req, res) => {
  try {
    console.log("no working")
    console.log(req.body)
    const userData = await userCollection.findOne({ email: req.user });
    const userId = userData._id;
    const productId = req.query.productId;

    const existingWishlist = await wishlistCollection.findOne({ userId });

    if (existingWishlist) {
      const existingProduct = existingWishlist.products.find(
        (product) => product.productId.toString() === productId
      );

      if (existingProduct) {
        return res
          .status(200)
          .json({ existing: true, message: "Product already in the Wishlist" });
      } else {
        existingWishlist.products.push({
          productId: new mongoose.Types.ObjectId(productId),
        });
        await existingWishlist.save();
      }
    } else {
      const newWishlist = new wishlistCollection({
        userId,
        products: [{ productId: new mongoose.Types.ObjectId(productId) }],
      });
      await newWishlist.save();
    }

    res.json({ message: "Product added to the Wishlist" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};



// delete wishlist
module.exports.deleteWishlist = async (req, res) => {
  try {
    const userData = await userCollection.findOne({ email: req.user });
    const userId = userData._id;
    const productId = req.params.productId;
    const updateWishlist = await wishlistCollection.updateOne(
      { userId: userId },
      {
        $pull: {
          products: {
            productId: productId,
          },
        },
      }
    );
    res.redirect("/wishlist");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};
