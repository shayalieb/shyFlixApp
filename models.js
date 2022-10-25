const mongoose = require('mongoose');

//Configring the movies database schema
//Data tpyes are: String and Boolean
let movieSchema = mongoose.Schema({
    Title: {type: String, required: true},
    Description: {type: String, required: true},
    Genre: {
        Name: String,
        Description: String,
    },
    Director: {
        Name: String,
        Bio: String,
    },
    Actors: [String],
    imagePath: String,
    Featured: Boolean
});

//Configuring the users stabase schema
//Data types are: String, Boolean, and Date
let userSchema = mongoose.Schema({
    Username: {type: String, required: true},
    Password: {type: String, required: true},
    Email: {type: String, required: true},
    DOB: Date,
    FavoriteMoveis: [{type: mongoose.Schema.Types.ObjectId, ref: 'Movie'}]
});

//Creating the models 
let Movie = mongoose.model('Movie', movieSchema);
let User = mongoose.model('User', userSchema);

//Exports the moodals to create/join the databas of the shyFilx app
module.exports.Movie = Movie;
module.exports.User = User;