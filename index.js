//Dependencies
const express = require('express');
const bodyParser = require('body-parser');
const uuid = require('uuid');
const { check, validationResult } = require('express-validator');


const morgan = require('morgan');
const app = express();
const mongoose = require('mongoose');

//Adding the models
const Models = require('./models.js')
const Movies = Models.Movie;
const Users = Models.User;



//Add functions
app.use(express.json());
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// parse various different custom JSON types as JSON
app.use(bodyParser.json({ type: 'application/*+json' }))

// parse some custom thing into a Buffer
app.use(bodyParser.raw({ type: 'application/vnd.custom-type' }))

// parse an HTML body into a string
app.use(bodyParser.text({ type: 'text/html' }))
app.use(morgan('common'))




//Mongoose URI connection
mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });
//THE OPEN MONGOOSE URI STRING
// mongoose.connect('mongodb+srv://shayalieberman:shaya1234@shyflixdb.hhh4rbo.mongodb.net/shyflixdb?retryWrites=true&w=majority',
//     { useNewUrlParser: true, useUnifiedTopology: true });

mongoose.set('strictQuery', true);
//CORS for access control

//app.use(cors());
let allowedOrigins = ['http://localhost:8080', 'https://shyflixapp.herokuapp.com', 'http://localhost:1234', 'https://shyflixapp.netlify.app', 'http://localhost:4200', 'https://shayalieb.github.io/myFlix-Angular-client' ];

//Adding cors
const cors = require('cors')

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {//if the origin is not found in allowed origins
            let message = 'Due to cors policy you cannot connect to this application ' + origin;
            return callback(new Error(message), false);
        }
        return callback(null, true);
    }
}));

//Adding the authorization method for login
let auth = require('./auth')(app);
const passport = require('passport');
require('./passport')




//CRUD operations

//GET default home page
app.get('/welcome', (req, res) => {
    res.status(200).send(
        `<h1>Welcome the the shyFlix Movie App</h1>
        <p>Check out the documentation <a href="https://shyflixapp.herokuapp.com/documentation">Click Here</a>`
    );
});
app.get('/documentation', (req, res) => {
    res.status(200).sendFile('/public/documentation.html', { root: __dirname });
})

//POST add a new user
app.post('/users',
    [
        check('Username', 'Username is required').isLength({ min: 6 }),
        check('Username', 'Username must contain alphanumeric characters only!').isAlphanumeric(),
        check('Password', 'Password is required').not().isEmpty(),
        check('Email', 'Must contain a valid email address').isEmail(),
    ], (req, res) => {
        //Check for validation errors
        let errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }
        //Hash passwords that are stored on the server
        let hashedPassword = Users.hashPassword(req.body.Password);
        Users.findOne({ Username: req.body.Username })
            .then((user) => {
                if (user) {
                    return res.status(400).send(req.body.Username + ' already exists!')
                } else {
                    Users.create({
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
                            res.status(500).send('Error: ' + err);
                        });
                }
            })
            .catch((error) => {
                console.error(error);
                res.status(500).send('Error: ' + err);
            });
    });

//GET list of of movies 
app.get('/movies', passport.authenticate('jwt', { session: false }), (req, res) => {
    Movies.find()
        .then((movies) => {
            res.status(200).json(movies)
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ', + err)
        });
});

//GET list of users
app.get('/users', passport.authenticate('jwt', { session: false }),
    function (req, res) {
        Users.find().then((users) => {
            res.status(201).json(users);
        })
            .catch((err) => {
                console.error(err);
                res.status(500).send('Error: ' + err);
            });
    });

//GET user by Username
app.get('/users/:Username', passport.authenticate('jwt', { session: false }),
    (req, res) => {
        Users.findOne({ Username: req.params.Username })
            .then((user) => {
                res.json(user);
            })
            .catch((err) => {
                console.error(err);
                res.status(500).send('Error: ' + err);
            });
    });

//GET movies by genre
app.get('/movies/Genre/:Name', passport.authenticate('jwt', { session: false }),
    (req, res) => {
        Movies.findOne({ 'Genre.Name': req.params.Name })
            .then((movie) => {
                res.json(movie.Genre);
            })
            .catch((err) => {
                console.error(err);
                res.status(500).send('Error: ' + err);
            });
    });

//GET movie by director
app.get('/movies/Director/:Name', passport.authenticate('jwt', { session: false }),
    (req, res) => {
        Movies.findOne({ 'Director.Name': req.params.Name })
            .then((movie) => {
                res.json(movie.Director);
            })
            .catch((err) => {
                console.error(err);
                res.status(500).send('Error: ' + err);
            });
    });

//GET single movie by title
app.get('/movies/:Title', passport.authenticate('jwt', { session: false }),
    (req, res) => {
        Movies.findOne({ Title: req.params.Title })
            .then((movie) => {
                res.json(movie);
            })
            .catch((err) => {
                console.error(err);
                res.status(500).send('Error: ' + err);
            });
    });

//PUT update a username
app.put('/users/:Username', passport.authenticate('jwt', { session: false }),
    [
        check('Username', 'Username must be at least 6 characters long').isLength({ min: 6 }),
        check('Username', 'Username must contain alphanumeric characters only!').isAlphanumeric(),
        check('Password', 'Password must be at least 8 characters to update').isLength({ min: 8 }),
        check('Email', 'Must contain a valid email address').isEmail(),
    ],
    (req, res) => {
        let errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }
        let hashedPassword = Users.hashPassword(req.body.Password);
        Users.findOneAndUpdate(
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
            (err, updateUser) => {
                if (err) {
                    console.error(err);
                    res.status(500).send('Error: ' + err);
                } else {
                    res.json(updateUser);
                }
            }
        );
    }
);


//POST add a movie to FavoriteMovies list
app.post('/users/:Username/movies/:_id', passport.authenticate('jwt', { session: false }),
    (req, res) => {
        Users.findOneAndUpdate({ Username: req.params.Username }, {
            $push: { FavoriteMovies: req.params._id }
        },
            { new: true },
            (err, updateUser) => {
                if (err) {
                    console.error(err);
                    res.status(500).send('Error: ' + err);
                } else {
                    res.json(updateUser);
                }
            });
    });

//DELETE remove a movie from a users favorite list
app.delete('/users/:Username/movies/:_id', passport.authenticate('jwt', { session: false }),
    (req, res) => {
        Users.findOneAndUpdate({ Username: req.params.Username }, {
            $pull: { FavoriteMovies: req.params._id }
        },
            { new: true },
            (err, updateUser) => {
                if (err) {
                    console.error(err);
                    res.status(500).send('Error: ' + err);
                } else {
                    res.json(updateUser);
                }
            });
    });

//DELETE remove a user account
app.delete('/users/:Username', passport.authenticate('jwt', { session: false }),
    (req, res) => {
        Users.findOneAndRemove({ Username: req.params.Username })
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
    });


//Event listeners
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
    console.log('Listening on port ' + port);
});