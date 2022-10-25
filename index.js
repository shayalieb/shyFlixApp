const 
    express = require('express');
    morgan = require('morgan');
    bodyParser = require('body-parser');
    uuid = require('uuid');
    fs = require('fs');
    path = require('path')
    http = require('http')


//Setting the functions
    const app = express();
    const mongoose = require('mongoose');
    const Models = require('./models.js');
    
    const {check, validateResults } = require('express-validator');
    
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));


//Applying the models
    const Movies = Models.Movie;
    const Users = Models.User;

    const passport = require('passport');
    require('./passport');

let auth = require('./auth')(app);


//Setting up the connection with the Mongo databse
mongoose.connect('mongodb://localhost:27017/shyFlixDB', { useNewUrlParser: true, useUnifiedTopology: true });


//Welcome text
app.get('/', (req, res) => {
    res.send('Welcome to the shyFlix movieDex');
});    
//Return a list of movies
app.get('/movies', (req, res) => {
    Movies.find()
    .then((movies) => {
        res.status(200).json(movies);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error' + err);
    });
});

//Get movie by title
app.get('/movies/:Title', (req, res) => {
    Movies.findOne({Title: req.params.Title})
    .then((movie) => {
        res.status(200).json(movie);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error' + err)
    });
});

//Get genre my name
app.get('/movies/genre/:Name', (req, res) => {
    Movies.findOne({ 'Genre.Name': req.params.Name})
    .then((movies) => {
        res.send(movies.Genre);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send("Error" + err);
    });
});

//get director data
app.get('/movies/Director/:Name', (req, res) => {
    Movies.findOne({ 'Director.Name': req.params.Name})
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
    Users.findOne({Username: req.body.Username})
    .then((user) => {
        if (user) {
            return res.status(400).send(req.body.Username + 'This user already exixst!');
        } else {
            Users
            .create({
                Username: req.body.Username,
                Password: req.body.Password,
                Email: req.body.Email,
                Birthday: req.body.Birthday
            })
            .then((user) => {res.status(201).json(user)})
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

app.listen(8080, () => console.log('Listening on port 8080'))