const mongoose = require("mongoose")
const bcrypt = require('bcryptjs');

const salt = bcrypt.genSaltSync(10);
//Configuring the movies database schema
//Data types are: String and Boolean
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

//Configuring the users database schema
//Data types are: String, Boolean, and Date
let userSchema = mongoose.Schema({
    Username: { type: String, required: true },
    Password: { type: String, required: true },
    Email: { type: String, required: true },
    Birthday: Date,
    FavoriteMovies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'movies' }]
});

/**
 * Hash the password for encryption
 * @param {*} password 
 * @returns a encrypted secure password
 */
userSchema.statics.hashPassword = (password) => {
    return bcrypt.hashSync(password, salt);
};

/**
 * Password validation
 * @param {*} password 
 * @returns a validated password
 */
userSchema.methods.validatePassword = function (password) {
    return bcrypt.compareSync(password, this.Password);
};

/**
 * Takes the collction from MongoDB
 */
let Movie = mongoose.model('Movie', movieSchema);
let User = mongoose.model('User', userSchema);

//Exports the modals to create/join the database of the shyFilx app
module.exports.Movie = Movie;
module.exports.User = User;

