const kb = require('./keyboard-buttons')

module.exports = {
    home: [
        [kb.home.getFilms],
        [kb.home.favourites, kb.home.cinemas]
    ],
    types: [
        [kb.types.movies],
        [kb.types.anime, kb.types.tvSeries],
        [kb.back]
    ]
}