const mongoose = require("mongoose")
const bcrypt = require('bcrypt');

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
    DOB: Date,
    FavoriteMovies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'movies' }]
});

userSchema.static.hashedPassword = (password) => {
    return bcrypt.hashSync(password, 10);
};

userSchema.methods.validatePassword = function (password) {
    return bcrypt.compareSync(password, this.Password);
};

let Movie = mongoose.model('Movie', movieSchema);
let User = mongoose.model('User', userSchema);

//Exports the modals to create/join the database of the shyFilx app
module.exports.Movie = Movie;
module.exports.User = User;

