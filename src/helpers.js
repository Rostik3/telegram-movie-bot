module.exports = {
    messageContent(movie) {
        return {
            poster: movie[0].picture,
            movieInfo: `Название: <b>${movie[0].name}</b>\nТип: ${movie[0].type}\nЖанр: ${movie[0].genre}\nОписание: ${movie[0].description}`,
            movieId: movie[0]._id
        }
    }
}