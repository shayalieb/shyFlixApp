const
    express = require('express');
const { check, validationResult } = require('express-validator')
morgan = require('morgan');
bodyParser = require('body-parser');
uuid = require('uuid');
fs = require('fs');
path = require('path')
http = require('http')
dotenv = require('dotenv');
dotenv.config();


//Setting the functions
const app = express();


const mongoose = require('mongoose');

const Models = require('./models');
const movies = models.movie;
const users = models.user;
// const dotenv = require('dotenv').config();
// app.use(dotenv)


mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });
let allowedOrigins = [
    'http://localhost:8080',
    'https://shyflixapp.herokuapp.com/',
    'http://localhost:1234',
];
// mongoose.connect('mongodb+srv://shayalieberman:shaya1234@shyflixdb.hhh4rbo.mongodb.net/shyflixdb?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true });
//mongoose.connect('mongodb://localhost:27017/myapp')
//mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));





//CORS Configuration
const cors = require('cors');
app.use(cors());


app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            let message = 'Due to CORS policy for shyFlixApp access from origin is not allowed! ' + origin;
            return callback(new Error(message), false);
        }
        return callback(null, true);
    }
}));


let auth = require('./auth')(app);
const passport = require('passport');
const { access } = require('fs');
require('./passport');



//Welcome text
app.get('/', (req, res) => {
    res.send('Welcome to the shyFlix movieDex');
});
//Return a list of movies
app.get('/movies', passport.authenticate('jwt', { session: false }), (req, res) => {
    movies.find()
        .then((movies) => {
            res.status(200).json(movies);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error' + err);
        });
});

//Get movie by title
app.get('/movies/:Title', passport.authenticate('jwt', { session: false }), (req, res) => {
    movies.findOne({ Title: req.params.Title })
        .then((movie) => {
            res.status(200).json(movie);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error' + err)
        });
});

//Get genre my name
app.get('/movies/genre/:Name', passport.authenticate('jwt', { session: false }), (req, res) => {
    movies.findOne({ 'Genre.Name': req.params.Name })
        .then((movies) => {
            res.send(movies.Genre);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Error" + err);
        });
});

//get director data
app.get('/movies/Director/:Name', passport.authenticate('jwt', { session: false }), (req, res) => {
    movies.findOne({ 'Director.Name': req.params.Name })
        .then((movies) => {
            res.send(movies.Director);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error' + err);
        })
})


//Add a new user
app.post('/users', (req, res) => {
    [
        check('Username', 'Username is required').isLength({ min: 6 }), //the validation logic
        check('Username', 'Username contains non-alphanumeric characters - not allowed').isAlphanumeric,//validation method
        check('Password', 'Password is required').not().isEmpty,//password must  be filled in
        check('Email', 'Invalid email address').isEmail()
    ], (req, res) => {
        //check for validation errors
        let errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }
    }
    let hashedPassword = users.hashPassword(req.body.Password);//hash any password weh registering before storing it
    users.findOne({ Username: req.body.Username })
        .then((user) => {
            if (user) {
                return res.status(400).send(req.body.Username + 'This user already exists!');
            } else {
                users
                    .create({
                        Username: req.body.Username,
                        Password: hashedPassword,
                        Email: req.body.Email,
                        Birthday: req.body.Birthday
                    })
                    .then((user) => { res.status(201).json(user) })
                    .catch((error) => {
                        console.error(error);
                        res.status(500).send('Error' + error);
                    })
            }
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send('Error' + error);
        });
});

//Add a movie to user favorites
app.post('/users/:Username/movies/:_id', passport.authenticate('jwt', { session: false }), (req, res) => {
    users.findOneAndUpdate({ Username: req.params.Username }, {
        $push:
            { FavoriteMovies: req.params.MovieID }
    },
        { new: true },
        (err, updateUser) => {
            if (err) {
                console.error(err);
                res.status(500).send('Error' + err);
            } else {
                res.json(updateUser);
            }
        });
});



//Delete a user by username
app.delete('/users/:Username', passport.authenticate('jwt', { session: false }), (req, res) => {
    users.findOneAndRemove({ Username: req.params.Username })
        .then((user) => {
            if (!user) {
                res.status(400).send(req.params.Username + 'The username was not found');
            } else {
                res.status(200).send(req.params.Username + 'The user has been deleted');
            }
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error:' + err);
        });
});

//Update user info
app.put('/users/:Username', passport.authenticate('jwt', { session: false }), (req, res) => {
    users.findOneAndUpdate({ Username: req.params.Username }, {
        $set:
        {
            Username: req.body.Username,
            Password: req.body.Password,
            Email: req.body.Email,
            Birthday: req.body.Birthday
        }
    },
        { new: true },
        (err, updateUser) => {
            if (err) {
                console.error(err);
                res.status(500).send('Error' + err);
            } else {
                res.json(updateUser);
            }
        });
});

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
    console.log('Listening on Port ' + port);
});