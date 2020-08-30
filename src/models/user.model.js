const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    telegramId: {
        type: Number,
        required: true
    },
    movies: {
        type: [String],
        default: []
    }
})

const userModel = mongoose.model('users', UserSchema);

module.exports = userModel;