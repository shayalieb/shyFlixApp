const mongoose = require("mongoose")
const bcrypt = require('bcrypt');

//Configring the movies database schema
//Data tpyes are: String and Boolean
let movieSchema = mongoose.Schema({
    Title: { type: String, required: true },
    Description: { type: String, required: true },
    Genre: {
        Name: String,
        Description: String,
    },
    Director: {
        Name: String,
        Bio: String,
    },
    Actors: [String],
    imagepath: String,
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

userSchema.static.hashedPassword = (password) => {
    return bcrypt.hashSync(password, 10);
};

userSchema.methods.validatePassword = function (password) {
    return bcrypt.compareSync(password.this.Password);
};

let movie = mongoose.model('movies', movieSchema);
let user = mongoose.model('users', userSchema);

//Exports the moodals to create/join the databas of the shyFilx app
module.exports.Movie = Movie;
module.exports.User = User;

