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
    imagePath: String,
    Featured: Boolean
});

//Configuring the users database schema
//Data types are: String, Boolean, and Date
let userSchema = mongoose.Schema({
    Username: { type: String, required: true },
    Password: { type: String, required: true },
    Email: { type: String, required: true },
    DOB: Date,
    FavoriteMovies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }]
});
//Enabling hashing for better password security
userSchema.statics.hashPassword = (password) => {
    return bcrypt.hashSync(password, 10);
};

userSchema.methods.validatePassword = function (password) {
    return bcrypt.compareSync(password, this.Password);
};

//Creating the models 
let Movie = mongoose.model('Movie', movieSchema);
let User = mongoose.model('User', userSchema);

//Exports the modals to create/join the database of the shyFlix app
module.exports.Movie = Movie;
module.exports.User = User;

