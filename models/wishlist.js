const mongoose = require("mongoose")
const wishlistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "userCollection"
  },
  products: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "productCollection"
      },
    },
  ],
});

const wishlistCollection = mongoose.model("wishlistCollection", wishlistSchema)
module.exports = wishlistCollection;