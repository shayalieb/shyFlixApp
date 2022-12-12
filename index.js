const express = require('express');
bodyParser = require('body-parser');
uuid = require('uuid');
morgan = require('morgan');
fs = require('fs');
path = require('path');

const app = express();
const mongoose = require('mongoose');
const model = require('./models.js');
const { check, validationResult } = require('express-validator');

const movies = models.movie;
const users = models.users;
const genre = models.Genre;
const directors = models.Director;

//mongoose.connect('mongodb+srv://shayalieberman:shaya1234@shyflixdb.hhh4rbo.mongodb.net/?retryWrites=true&w=majority')
mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });


//Middleware functions
app.use(bodyParser());
app.use(bodyParser.urlencoded({ extended: true }));

//Will use cors as the default authenticator and by default will allow requests from all origins
const cors = require('cors');

//this will allow us to accept requests from the front end of the site
let allowedOrigins = ['http://localhost:1234', 'http://localhost:8080', 'https://shyflixapp.herokuapp.com/'];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            let message = 'The CORS policy does not allow access for this application' + origin;
            return callback(new Error(message), false);
        }
        return callback(null, true);
    }
}));

//Import the auth.js file (app) is to ensure express is available in the auth.js
//Require and import the passport.js file 
require('./auth')(app);

const passport = require('passport');
const path = require('path');
require('./passport');

//Will take the data and apply it to the logs
const accessLogStream = fs.accessLogStream(path.join(__dirname, 'log.txt'), { flags: 'a' })
app.use(morgan('common', { stream: accessLogStream }));
app.use(express.static('public'));
app.get('/', (req, res) => {
    res.send('Welcome to the shyFlix Movie App')
});

//GET a list aof all movies 
app.get('./movies', passport.authenticate('jwt', { session: false }), (req, res) => {
    movies.find()
        .then(function (movies) {
            res.status(201).json(movies)
        })
        .catch(function (error) {
            console.error(error);
            res.status(500).send('Error:' + error);
        });
});

//GET a movie by title
app.get('/movies/:Title', passport.authenticate('jwt', { session: false }), (req, res) => {
    movies.findOne({ Title: req.params.Title })
        .then((movie) => {
            res.status(200).json(movie);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

//GET by Genre name
app.get('/movies/Genre/:Name', passport.authenticate('jwt', { session: false }), (req, res) => {
    movies.findOne({ 'Genre.Name': req.params.Name })
        .then((movies) => {
            res.send(movies.Genre);
        })
        .catch((err) => {
            res.status(500).send('Error:' + err)
        });
});

//GET director by name
app.get('/movies/Director/:Name', passport.authenticate('jwt', { session: false }), (req, res) => {
    movies.findOne({ 'Director.Name': req.params.Name })
        .then((movies) => {
            res.send(movies.Director);
        })
        .catch((err) => {
            res.status(500).send('Error:' + err)
        });
})

//GET all user data
app.get('/users', passport.authenticate('jwt', { session: false }), (req, res) => {
    users.find()
        .then((users) => {
            res.status(200).json(users);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err)
        });
});

//GET user by username
app.get('/users/Username', passport.authenticate('jwt', { session: false }), (req, res) => {
    movies.findOne({ 'Users.Username': req.params.Username })
        .then((user) => {
            res.status(200).json(user)
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err)
        });
});

//POST allow users to register
app.post('/users', [
    check('Username', 'Username is required').isLength({ min: 6 }),
    check('Username', 'Username cannot contain alphanumeric characters').isAlphanumeric(),
    check('Password', 'Password is required').not().isEmpty(),
    check('Email', 'Must contain a valid email address').isEmail(),
], (req, res) => {
    //Check validation objects for error
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }
    //This will hash the passwords before being stored in the database for added security
    let hashedPassword = users.hashedPassword(req.body.Password);
    users.findOne({ Username: req.body.Username })
        .then((user) => {
            if (user) {
                return res.status(400).send(req.body.Username + ' already exists');
            } else {
                users.create({
                    Username: req.body.Username,
                    Password: hashedPassword,
                    Email: req.body.Email,
                    Birthday: req.body.Birthday
                })
                    .then((user) => { res.status(201).json(user) })
                    .catch((error) => {
                        console.error(error);
                        res.status(500).send('Error:' + error);
                    })
            }
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send('Error:' + error);
        });
});

//PUT allow user to update their info
app.put('/users/:Username', passport.authenticate('jwt', { session: false }),
    [
        check('Username', 'Username is required').isLength({ min: 6 }),
        check('Username', 'Username cannot contain alphanumeric characters').isAlphanumeric(),
        check('Password', 'Password is required').not().isEmpty(),
        check('Email', 'Must contain a valid email address').isEmail(),
    ], (req, res) => {
        let errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }
        let hashedPassword = users.hashedPassword(req.body.Password);
        users.findOneAndUpdate({ Username: req.params.Username },
            {
                $set: {
                    Username: req.body.Username,
                    Password: hashedPassword,
                    Email: req.body.Email,
                    Birthday: req.body.Birthday
                },
            },
            { new: true },
            (err, updatedUser) => {
                if (err) {
                    console.error(err);
                    res.status(500).send('Error:' + err);
                } else {
                    res.json(updatedUser);
                }
            });
    });

//POST allow users to add movies to their list of FavoriteMOvies
app.post('users/:Username/movies/_id', passport.authenticate('jwt', { session: false }), (req, res) => {
    users.findOneAndUpdate({ Username: req.params.Username }, {
        $push: { FavoriteMovies: req.params._id }
    },
        { new: true },
        (err, updatedUser) => {
            if (err) {
                console.error(err);
                res.status(500).send('Error:' + err);
            } else {
                res.json(updatedUser);
            }
        });
});

//DELETE allow users to delete a movie from favorites
app.delete('/users/:Username/movies:_id', passport.authenticate('jwt', { session: false }), (req, res) => {
    users.findOneAndUpdate({ Username: req.params.Username }, {
        $pull: { FavoriteMovies: req.params._id }
    },
        { new: true },
        (err, updatedUser) => {
            if (err) {
                console.error(err);
                res.status(500).send('Error: ' + err);
            } else {
                res.json(updatedUser);
            }
        });
});

//DELETE allow users to delete their account
app.delete('/users/:Username', passport.authenticate('jwt', { session: false }), (req, res) => {
    users.findOneAndRemove({ Username: req.params.Username })
        .then((user) => {
            if (!user) {
                res.status(400).send(req.params.Username + 'was not found');
            } else {
                res.status(200).send(req.params.Username + 'was deleted');
            }
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

//Middleware error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke and is not working correctly');
})

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
    console.log('Listening on port 8080')
})