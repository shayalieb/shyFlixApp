const mongoose = require('mongoose');
//importing the encryption function
const bcrypt = require('bcrypt');

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
    username: {type: String, required: true},
    password: {type: String, required: true},
    email: {type: String, required: true},
    birthday: Date,
    FavoriteMoveis: [{type: mongoose.Schema.Types.ObjectId, ref: 'Movie'}]
});
//Enabling hashing for better password security
userSchema.statics.hashPassword = (password) => {
    return bcrypt.hashSync(password, 10);
};

userSchema.methods.validatePassword = function (password) {
    return bcrypt.compareSync(password, this.password);
};

//Creating the models 
let Movie = mongoose.model('Movie', movieSchema);
let User = mongoose.model('User', userSchema);

//Exports the moodals to create/join the databas of the shyFilx app
module.exports.Movie = Movie;
module.exports.User = User;

