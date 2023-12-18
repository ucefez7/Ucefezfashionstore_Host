const mongoose = require("mongoose");
const cartSchema = new mongoose.Schema ({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "userCollection"
  },
  products: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "productCollection"
    },
    quantity: {
      type: Number,
    },
  }]
});

const cart = mongoose.model("cart", cartSchema);
module.exports = cart;