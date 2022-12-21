const express = require('express'),
    morgan = require('morgan'),
    bodyParser = require('body-parser'),
    uuid = require('uuid'),
    mongoose = require('mongoose'),
    Models = require('./models.js');


const app = express();
const Movies = Models.Movie;
const Users = Models.User;

const { check, validationResult } = require('express-validator');

app.use(express.json());

//mongoose.set('strictQuery', true);
mongoose.connect('mongodb+srv://shayalieberman:shaya1234@shyflixdb.hhh4rbo.mongodb.net/?retryWrites=true&w=majority').then(() => console.log('Connected!'));
//mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const cors = require('cors');
app.use(cors());

let allowedOrigins = ['http://localhost:1234', 'http://localhost:8080', 'https://shyflixapp.herokuapp.com/', ''];

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

app.use(bodyParser.json());
app.use(morgan('common'));
app.use(express.static('public'))

app.use(bodyParser.urlencoded({ extended: true }));

let auth = require('./auth')(app)
const passport = require('passport');
require('./passport.js');

//GET Welcome page
app.get('/', (req, res) => {
    res.status('Welcome to the shyFlix MovieDex App')
})

//GET list of movies
app.get('/movies',
    // passport.authenticate('jwt', {session: false}),
    (req, res) => {
        Movies.find()
            .then((movies) => {
                res.status(201).json(movies);
            })
            .catch((err) => {
                console.log(err)
                res.status(500).send('Error: ' + err);
            });
    });

//GET movie by title
app.get('/movies/:Title', passport.authenticate('jwt', { session: false }),
    (req, res) => {
        Movies.findOne({ Title: req.params.Title })
            .then((movie) => {
                res.json(movie);
            })
            .catch((err) => {
                console.log(err);
                res.status(500).send('Error: ' + err)
            });
    });

//GET a list of movies by Genre/:Name    
app.get('/movies/Genre/:Name', passport.authenticate('jwt', { session: false }),
    (req, res) => {
        Movies.findOne({ 'Genre.Name': req.params.Name })
            .then((movie) => {
                res.status(201).json(movie.Genre);
            })
            .catch((err) => {
                console.log(err);
                res.status(500).send('Error: ' + err);
            });
    });

//GET movie by director name
app.get('/movies/Director/:Name', passport.authenticate('jwt', { session: false }),
    (req, res) => {
        Movies.findOne({ 'Director.Name': req.params.Name })
            .then((movie) => {
                res.status(201).json(movie.Director);
            })
            .catch((err) => {
                console.log(err);
                res.status(500).send('Error: ' + err);
            });
    });

//POST a movie 
app.post('/movies', passport.authenticate('jwt', { session: false }),
    (req, res) => {
        Movies.findOne({ Username: req.body.Title }).then((movie) => {
            if (movie) {
                return res.status(400).send(req.body.Title + 'already exists');
            } else {
                Movies.create({
                    Title: req.body.Title,
                    Description: req.body.Description,
                    Genre: {
                        Name: res.body.Name,
                        Description: req.body.Description,
                    },
                    Director: {
                        Name: req.body.Name,
                        Bio: req.body.Bio,
                    },
                    imagepath: req.body.imagepath,
                    Featured: req.body.Boolean,
                })
                    .then((movie) => {
                        res.status(201).json(movie);
                    })
                    .catch((err) => {
                        console.log(err);
                        res.status(500).send('Error: ' + err);
                    });
            }
        });
    });

//POST a movie to a users list
app.post('/users/:Username/movies/:_id', passport.authenticate('jwt', { session: false }),
    (req, res) => {
        Users.findOneAndUpdate(
            { Username: req.params.Username },
            {
                $push: { FavoriteMovies: req.params._id },
            },
            { new: true },
            (err, updateUser) => {
                if (err) {
                    console.lof(err);
                    res.status(500).send('Error: ' + err);
                } else {
                    res.json(updateUser);
                }
            });
    });

//DELETE a movie from a user list
app.delete('/users/:Username/movies/:_id', passport.authenticate('jwt', { session: false }),
    (req, res) => {
        Users.findByIdAndUpdate(
            { Username: req.params.Username },
            {
                $pull: { FavoriteMovies: req.params._id },
            },
            { new: true },
            (err, updateUser) => {
                if (err) {
                    console.log(err);
                    res.status(500).send('Error: ' + err);
                } else {
                    res.json(updateUser)
                }
            });
    });

//GET users info
app.get('/users', passport.authenticate('jwt', { session: false }),
    (req, res) => {
        Users.find()
            .then((users) => {
                res.status(201).json(users);
            })
            .catch((err) => {
                console.log(err);
                res.status(500).send('Error: ' + err);
            });
    });

//POST allow users to register
app.post('/users',
    [
        check('Username', 'Username is required').isLength({ min: 6 }),
        check('Username', 'Username contains non-alphanumeric characters - not allowed!').isAlphanumeric(),
        check('Password', 'Password is required').not().isEmpty(),
        check('Email', 'A valid email address is required').isEmail(),
    ],
    (req, res) => {
        let errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        let hashedPassword = Users.hashedPassword(req.body.Password);
        Users.findOne({ Username: req.body.Username })
            .then((user) => {
                if (user) {
                    return res.status(400).send(req.body.Username + ' already exist!');
                } else {
                    Users.create({
                        Username: req.body.Username,
                        Password: hashedPassword,
                        Email: req.body.Email,
                        Birthday: req.body.Birthday,
                    })
                        .then((user) => {
                            res.status(201).json(user);
                        })
                        .catch((error) => {
                            console.error(error);
                            res.status(500).send('Error: ' + error);
                        })
                }
            })
            .catch((error) => {
                console.error(error);
                res.status(500).send('Error: ' + error);
            });
    });

//PUT update a user
app.put('/users/:Username', passport.authenticate('jwt', { session: false }),
    (req, res) => {
        Users.findOneAndUpdate(
            { Username: req.params.Username },
            {
                $set: {
                    Username: req.body.Username,
                    Password: req.body.Password,
                    Email: req.body.Email,
                    Birthday: req.body.Birthday,
                },
            },
            { new: true },
            (err, updateUser) => {
                if (err) {
                    console.log(err);
                    res.status(500).send('Error: ' + err)
                } else {
                    res.json(updateUser);
                }
            });
    });

//DELETE a use (deregister)
app.delete('/users/:Username', passport.authenticate('jwt', { session: false }),
    (req, res) => {
        Users.findOneAndRemove({ Username: req.params.Username })
            .then((user) => {
                if (!user) {
                    res.status(400).send(req.params.Username + ' was not found');
                } else {
                    res.status(201).send(req.params.Username + ' has been deleted');
                }
            })
            .catch((err) => {
                console.log(err);
                res.status(500).send('Error: ' + err);
            });
    });

//GET the documentation on this API
app.get('/documentation', passport.authenticate('jwt', { session: false }),
    (req, res) => {
        res.sendFile('public/documentation.html', { root: __dirname });
    });

//Error handling for middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send(`An error has occurred:${err}`);
});

//LISTENERS
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
    console.log('Listening on port ' + port)
})