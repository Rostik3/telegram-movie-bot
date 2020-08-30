const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MovieSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    latin_id: {
      type: String,
      required: true
    },
    type: {
        type: String,
        required: true
    },
    genre: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false
    },
    picture: {
        type: String,
        required: true
    }
})

const movieModel = mongoose.model('movies', MovieSchema);

module.exports = movieModel;