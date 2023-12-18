const mongoose = require("mongoose")

const  addressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "userCollection",
  },
  address: [
    {
      userName: {
        type: String,
        required: true,
      },
      addressType: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      landmark: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      postcode: {
        type: String,
        required: true,
      },
      phoneNumber: {
        type: String,
        required: true,
      },
      altphone: {
        type: String,
      },
    }
  ]
})

const addressCollection = mongoose.model("addressCollection", addressSchema)
module.exports = addressCollection;

