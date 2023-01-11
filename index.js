//App dependencies
const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const { check, validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path')

//Adding the database schemas
const models = require('./models')
const movies = models.movie;
const users = models.user;

//Adding the use of express
const app = express()

const accessLogStream = fs.createReadStream(path.join(__dirname, 'log.text'), {
    flags: 'a',
});

//Adding middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const cors = require('cors');
app.use(cors());

let auth = require('./auth')(app);

const passport = require('passport');

app.use(morgan('combined', { stream: accessLogStream }));

app.use(express.static('public'));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send(`Error: ${err.stack}`);
});

//GET default home page for server side
app.get('/', (req, res) => {
    res.status(200).send(
        `<h1>Welcome the the shyFlix Movie App</h1>
        <p>Check out the documentation <a href="https://shyflixapp.herokuapp.com/documentation">Click Here</a>`
    );
});

app.get('/documentation', (req, res) => {
    res.status(200).sendFile('/public/documentation.html', { root: __dirname });
})


//POST adding a new user
app.post('/users',
    [
        check('Username', 'Username has to be minimum 6 characters long').isLength({ min: 5 }),
        check('username', 'Username must contain alphanumeric characters').isAlphanumeric(),
        check('Password', 'Password is required to register').not().isEmpty(),
        check('Email', 'Must contain a valid email address to register').isEmail(),
    ],
    (req, res) => {
        let errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        let hashedPassword = users.hashedPassword(req.body.Password);
        users.findOne({ Username: req.body.Username })
            .then((user) => {
                if (user) {
                    return res.status(400).send(req.body.Username + 'The username already exists');
                } else {
                    users.create({
                        Username: req.body.username,
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
                        });
                }
            })
            .catch((error) => {
                console.error(error);
                res.status(500).send('Error: ' + error)
            });
    }
);

//GET return a list of all movies
app.get('/movies', passport.authenticate('jwt', { session: false }),
    (req, res) => {
        movies.find().then((movies) => {
            res.status(201).json(movies);
        })
            .catch((err) => {
                console.error(err);
                res.status(500).send('Error: ' + err);
            });
    }
);

//GET return a single movie by the /movies/:Title
app.get('/movies/:Title', passport.authenticate('jwt', { session: false }),
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

//GET return a movie genres
app.get('/movies/Genre/:Name', passport.authenticate('jwt', { session: false }),
    (req, res) => {
        movies.findOne({ 'Genre.Name': req.params.Name })
            .then((movie) => {
                res.json(movie.Genre);
            })
            .catch((err) => {
                console.error(err);
                res.status(500).send('Error: ' + err);
            });
    }
);

//GET return a movie director by name
app.get('/movies/Genre/:Name', passport.authenticate('jwt', { session: false }),
    (req, res) => {
        movies.findOne({ 'Genre.Name': req.params.Name })
            .then((movie) => {
                res.json(movie.Genre);
            })
            .catch((err) => {
                console.error(err);
                res.status(500).send('Error: ' + err);
            });
    }
);

//GET return users
app.get('/users', passport.authenticate('jwt', { session: false }),
    (req, res) => {
        users.findOne({ Username: req.params.Username })
            .then((user) => {
                res.json(user);
            })
            .catch((err) => {
                console.error(err);
                res.status(500).send('Error: ' + err)
            });
    }
);

//GET return users by Username
app.get('/users/:Username', passport.authenticate('jwt', { session: false }),
    (req, res) => {
        users.findOne({ Username: req.params.Username })
            .then((user) => {
                res.json(user);
            })
            .catch((err) => {
                console.error(err);
                res.status(500).send('Error: ' + err)
            });
    }
);

//PUT update a user profile
app.put('/users/:Username', passport.authenticate('jwt', { session: false }),
    [
        check('Username', 'Username has to be a minimum of 6 characters long').isLength({ min: 6 }),
        check('Username', 'Username must contain only alphanumeric characters').isAlphanumeric(),
        check('Password', 'Password is required').not().isEmpty(),
        check('Email', 'You must provide a valid email address').isEmail(),
    ],
    (req, res) => {
        let errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }
        users.findOneAndUpdate({ Username: req.params.Username },
            {
                $set: {
                    Username: req.body.Username,
                    Password: req.body.Password,
                    Email: req.body.Email,
                    Birthday: req.body.Birthday,
                },
            },
            { new: true }
        )
            .then((user) => {
                res.status(200).json(user);
            })
            .catch((err) => {
                console.error(err);
                res.status(500).send('Error: ' + err);
            });
    }
);

//POST add a movie to a users favorite movies list
app.post('/users/:Username/movies/:_id', passport.authenticate('jwt', { session: false }),
    (req, res) => {
        users.findByIdAndUpdate({ Username: req.params.Username },
            {
                $push: {
                    FavoriteMovies: req.params._id
                },
            },
            { new: true }
        )
            .then((user) => {
                res.status(200).json(user);
            })
            .catch((err) => {
                console.error(err);
                res.status(500).send('Error: ' + err);
            });
    }
);

//DELETE remove a movie from favorites movies list
app.delete('/users/:Username/movies/:_id', passport.authenticate('jwt', { session: false }),
    (req, res) => {
        users.findOneAndUpdate({ Username: req.params.Username },
            {
                $pull: {
                    FavoriteMovies: req.params._id
                },
            },
            { new: true }
        ).then((user) => {
            res.status(200).json(user);
        })
            .catch((err) => {
                console.error(err);
                res.status(500).send('Error: ' + err);
            });
    }
);

//DELETE remove a user account
app.delete('/users/:Username', passport.authenticate('jwt', { session: false }),
    (req, res) => {
        users.findByIdAndRemove({ Username: req.params.Username })
            .them((user) => {
                if (!user) {
                    res.status(400).send(req.params.Username + 'was not found');
                } else {
                    res.status(200).send(req.params.Username + 'has been deleted');
                }
            })
            .catch((err) => {
                console.error(err);
                res.status(500).send('Error: ' + err);
            });
    }
);

//Listener
app.listen(process.env.PORT, () => {
    console.log`App is running on ${process.env.HOST}:${process.end.PORT}`
});

