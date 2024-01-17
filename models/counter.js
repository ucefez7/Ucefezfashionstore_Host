const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    value: {
        type: Number,
        required: true,
        default: 1000, // Starting value for the counter
    },
});

const Counter = mongoose.model('Counter', counterSchema);

module.exports = Counter;
