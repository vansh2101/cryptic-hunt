const mongoose = require('mongoose');
const datetime = require('node-datetime');

let userSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    username: {type: String, unique: true},
    name: String,
    school: String,
    email: {type: String, unique: true},
    password: String,
    created: {type: String, default: datetime.create().format('H:M d-m-Y ')},
    level: {type: Number, default: 0},
    score: {type: Number, default: 0},
});

module.exports=mongoose.model('users', userSchema)