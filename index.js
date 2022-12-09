const express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    uuid = require('uuid'),
    morgan = require('morgan'),
    mongoose = require('mongoose'),
    models = require('./models.js')
cors = require('cors')

const { check, validationResult } = require('express-validator');

const movies = models.movies,
    users = models.User;

app.use(bodyParser.json());
app.use(morgan('common'));

//Import and use CORS, allow all domains to make requests
const cors = require('cors');
app.use(express.static('public'));
app.use(cors());

//Import and use passport
let auth = require('./auth.js')(app);
const passport = require('passport');
const { access } = require('fs');
require('./passport.js')

//Connect to mongoose
mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });
//mongoose.connect('mongodb+srv://shayalieberman:shaya1234@shyflixdb.hhh4rbo.mongodb.net/?retryWrites=true&w=majority')

let allowedOrigins = ['http://localhost:1234', 'http://localhost:8080', 'https://shyflixapp.herokuapp.com/', 'https://strong-daifuku-4e6ea6.netlify.app/'];
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            let message = 'CORS Policy for this application  does not allow for access from origin ' + origin;
            return callback(new Error(message), false);
        }
        return callback(null, true)
    }
}));


//Welcome message
app.get('/', (req, res) => {
    res.send('Welcome to the shyFlix Movie App!')
})

//POST Create a new user
app.post('/users', [
    check('Username', 'Username is required').isLength({ min: 5 }),
    check('Username', 'Username must contain alphanumeric characters only!').isAlphanumeric(),
    check('Password', 'password is required').not().isEmpty(),
    check('Email', 'You must provide a valid email address').isEmail(),
], (req, res) => {
    //Check validation for errors
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }

    let hashedPassword = users.hashedPassword(req.body.Password);
    users.findOne({ Username: req.body.Username })
        .then((user) => {
            if (user) {
                return res.status(400).send(req.body.Username + ' already exists!')
            } else {
                users.create({
                    Username: req.body.Username,
                    Password: hashedPassword,
                    Email: req.body.Email,
                    Birthday: req.body.Birthday
                })
                    .then((user) => {
                        res.status(201).json(user)
                    })
                    .catch((error) => {
                        console.error(error);
                        res.status(500).send('Error: ' + error);
                    });
            }
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send('Error:' + error);
        });
});

//READ all users
app.get('/users', passport.authenticate('jwt', { session: false }),
    (req, res) => {
        users.find().then((users) => {
            res.status(200).json(users);
        })
            .catch((err) => {
                console.error(err);
                res.status(500).send('Error: ' + err);
            });
    });

//READ by username
app.get('/users/:Username', passport.authenticate('jwt', { session: false }),
    (req, res) => {
        users.findOne({ Username: req.params.Username })
            .then((user) => {
                res.json(user);
            })
            .catch((err) => {
                console.error(err);
                res.status(500).send('Error:' + err);
            });
    }
);

//UPDATE by username
app.put(
    '/users/:Username',
    [
        check('Username', 'Username is required').isLength({ min: 5 }),
        check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
        check('Password', 'Password is required').not().isEmpty(),
        check('Email', 'Email does not appear to be valid').isEmail(),
        passport.authenticate('jwt', { session: false }),
    ],
    (req, res) => {
        // check validation object for errors
        let errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        let hashedPassword = Users.hashPassword(req.body.Password);
        users.findOneAndUpdate(
            { Username: req.params.Username },
            {
                $set: {
                    Username: req.body.Username,
                    Password: hashedPassword,
                    Email: req.body.Email,
                    Birthday: req.body.Birthday,
                },
            },
            { new: true },
            (err, updatedUser) => {
                if (err) {
                    console.error(err);
                    res.status(500).send('Error: ' + err);
                } else {
                    res.json(updatedUser);
                }
            }
        );
    }
);

//CREATE add favorite movie to user
app.post('/users/:Username/movies/:_id',
    passport.authenticate('jwt', { session: false }),
    (req, res) => {
        users.findOneAndUpdate(
            { Username: req.params.Username },
            {
                $push: { FavoriteMovies: req.params.MovieID },
            },
            { new: true },
            (err, updatedUser) => {
                if (err) {
                    console.error(err);
                    res.status(500).send('Error: ' + err);
                } else {
                    res.json(updatedUser);
                }
            }
        );
    }
);

//DELETE a favorite movie for user
app.delete('/users/:Username/movies/_id',
    passport.authenticate('jwt', { session: false }),
    (req, res) => {
        users.findOneAndUpdate(
            { Username: req.params.Username },
            {
                $pull: { FavoriteMovies: req.params.MovieID },
            },
            { new: true },
            (err, updatedUser) => {
                if (err) {
                    console.error(err);
                    res.status(500).send('Error: ' + err);
                } else {
                    res.json(updatedUser);
                }
            }
        );
    }
);

//DELETE user by username
app.delete('/users/:Username',
    passport.authenticate('jwt', { session: false }),
    (req, res) => {
        users.findOneAndRemove({ Username: req.params.Username })
            .then((user) => {
                if (!user) {
                    res.status(400).send(req.params.Username + ' was not found');
                } else {
                    res.status(200).send(req.params.Username + ' was deleted.');
                }
            })
            .catch((err) => {
                console.error(err);
                res.status(500).send('Error: ' + err);
            });
    }
);

//READ all movies
app.get(
    '/movies',
    passport.authenticate('jwt', { session: false }),
    (req, res) => {
        movies.find()
            .then((movies) => {
                res.status(200).json(movies);
            })
            .catch((err) => {
                console.error(err);
                res.status(500).send('Error: ' + err);
            });
    }
);

//READ a movie by title
app.get('/movies/:Title',
    passport.authenticate('jwt', { session: false }),
    (req, res) => {
        movies.findOne({ Title: req.params.Title })
            .then((movie) => {
                res.json(movie);
            })
            .catch((err) => {
                console.error(err);
                res.status(500).send('Error: ' + err);
            });
    }
);

//READ genre by name
app.get('/movies/genre/:genreName',
    passport.authenticate('jwt', { session: false }),
    (req, res) => {
        movies.findOne({ 'Genre.Name': req.params.genreName })
            .then((movie) => {
                res.json(movie.Genre);
            })
            .catch((err) => {
                console.error(err);
                res.status(500).send('Error: ' + err);
            });
    }
);
//READ director by name
app.get('/movies/directors/:directorName',
    passport.authenticate('jwt', { session: false }),
    (req, res) => {
        movies.findOne({ 'Director.Name': req.params.directorName })
            .then((movie) => {
                res.json(movie.Director);
            })
            .catch((err) => {
                console.error(err);
                res.status(500).send('Error: ' + err);
            });
    }
);

//Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('An error was encountered!');
});

//Listening on local host
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
    console.log('Listening on Port ' + port);
});