const mongoose = require('mongoose');

let quesSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    number: Number,
    question: String,
    answer: String,
});

module.exports=mongoose.model('questions', quesSchema)