const TelegramBot = require('node-telegram-bot-api')
const config = require('./config')
const mongoose = require('mongoose')
const Movie = require('./models/movie.model')
const User = require('./models/user.model')
const helpers = require('./helpers')
const keyboard = require('./keyboard')
const buttons = require('./keyboard-buttons')

// initialize bot
const bot = new TelegramBot(config.API_TOKEN, {
    webHook: {
        port: process.env.PORT || 5000
    }
})

bot.setWebHook(`${config.HEROKU_URL}/bot${config.API_TOKEN}`)

// set db connection
mongoose.connect(config.DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDb connected')).catch((err) => console.log(err))

// service functions
const getRandomMovie = (chatId, userId) => {
    Movie.aggregate([{$sample: {size: 1}}]).then(movie => {
        sendMovieData(chatId, userId, helpers.messageContent(movie))
    })
}

const getRandomByTypes = (chatId, userId, parameter) => {
    Movie.aggregate([
        {$match: parameter},
        {$sample: {size: 1}}
        ]).then(movie => {
        sendMovieData(chatId, userId, helpers.messageContent(movie))
    })
}

const sendMovieData = (chatId, userId, {poster, movieInfo, movieId}) => {
    Promise.all([
        Movie.findOne({_id: movieId}),
        User.findOne({telegramId: userId})
    ]).then(([movie, user]) => {

        let isFav = false;

        if (user) {
            isFav = user.movies.indexOf(movie._id) !== -1;
        }

        const favText = isFav ? 'Удалить из избранного' : 'Добавить в избранное';

        bot.sendPhoto(chatId, poster, {
            caption: movieInfo,
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: favText,
                            callback_data: JSON.stringify({
                                isFav,
                                movieId
                            })
                        }
                    ]
                ]
            }
        })
    })
}

const toggleFavouriteFilm = (userId, queryId, {movieId, isFav}) => {
    let userPromise = {};

    User.findOne({telegramId: userId})
        .then(user => {
            if (user) {
                if (isFav) {
                    user.movies = user.movies.filter(m_id => m_id !== movieId)
                } else {
                    user.movies.push(movieId)
                }
                userPromise = user;
            } else {
                userPromise = new User({
                    telegramId: userId,
                    movies: [movieId]
                })
            }

            const answerText = isFav ? 'Deleted' : 'Added';

            userPromise.save().then(_ => {
                bot.answerCallbackQuery(queryId, {
                    text: answerText
                })
            }).catch(err => console.log(err))
        })
}

const showFavouriteFilms = (chatId, telegramId) => {
    User.findOne({telegramId})
        .then(user => {
            if (user) {
                Movie.find({_id: {'$in': user.movies}}).then(movies => {
                    let html = '';

                    if (movies.length) {
                        html = movies.map((m, i) => {
                            return `<b>${i + 1}. ${m.name}</b>\nПоказать - /show_${m.latin_id}\n`
                        }).join('\n')
                    } else {
                        html = 'Вы пока ничего не добавили';
                    }
                    bot.sendMessage(chatId, html, {parse_mode: 'HTML'})
                }).catch(e => console.log(e))
            } else {
                bot.sendMessage(chatId, 'Вы пока ничего не добавил')
            }
        }).catch(e => console.log(e))
}

bot.onText(/\/start/, msg => {
    const chatId = msg.chat.id
    const addedUser = `Пользователь - ${msg.from.username} активировал бота`
    const welcomeText = `Привет, ${msg.from.first_name}, на связи кинобот, посоветую тебе рандомный фильм/сериал/аниме\nТы также можешь посоветовать что-то свое, воспользовавшись командой /propose (название фильма: пару слов/предложений о нем)\nА теперь кликни уже куда-нибудь`
    bot.sendMessage(chatId, welcomeText, {
        reply_markup: {
        keyboard: keyboard.home
    }
    })
    bot.sendMessage(config.PROPOSE_CHAT, addedUser)
})

bot.onText(/\/\b(propose\b)\s/, msg => {
    const propositionText = `#Предложение\nОт: ${msg.from.username}\nФильм:${msg.text.replace(/\/propose/, '')}`
    bot.sendMessage(config.PROPOSE_CHAT, propositionText)
    bot.sendMessage(msg.chat.id, 'Спосебо :)')
})

bot.onText(/\/show_(.+)/, (msg, [source, match]) => {
    getRandomByTypes(msg.chat.id, msg.from.id, {latin_id: match})
})

bot.on('message', msg => {
    const chatId = msg.chat.id
    const userId = msg.from.id

    switch (msg.text) {
        case buttons.home.getFilms:
            getRandomMovie(chatId, userId)
            break;
        case buttons.home.favourites:
            showFavouriteFilms(chatId, userId)
            break;
        case buttons.home.cinemas:
            bot.sendMessage(chatId, 'Чуз', {
                reply_markup: {
                    keyboard: keyboard.types
                }
            })
            break;
        case buttons.types.anime:
            getRandomByTypes(chatId, userId, {type: 'Аниме' })
            break;
        case buttons.types.tvSeries:
            getRandomByTypes(chatId, userId, {type: 'Сериал'})
            break;
        case buttons.types.movies:
            getRandomByTypes(chatId, userId, {type: 'Фильм'})
            break;
        case buttons.back:
            bot.sendMessage(chatId, 'Полный рандом лучше, броу', {
                reply_markup: {
                    keyboard: keyboard.home
                }
            })
            break;
    }
})

bot.on('callback_query', query => {
    let data = '';

    try {
        data = JSON.parse(query.data)
    } catch (e) {
        throw new Error('Data is not an object')
    }

    toggleFavouriteFilm(query.from.id, query.id, data)
})