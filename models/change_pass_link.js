const mongoose = require('mongoose');

let userSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    user_id: {type: String, unique: true},
    expire_at: {type: Date, default: Date.now, expires: 600},
});

module.exports=mongoose.model('change_pass_links', userSchema)