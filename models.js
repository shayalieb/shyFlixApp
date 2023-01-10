const mongoose = require('mongoose'),
    bcrypt = require('bcrypt');

// mongoose.set('strictQuery', true)

// mongoose.connect(process.env.CONNECTION_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
// });

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

let userSchema = mongoose.Schema({
    Username: { type: String, required: true },
    Password: { type: String, required: true },
    Email: { type: String, required: true },
    Birthday: Date,
    FavoriteMovies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'movies' }],
});

userSchema.static.hashedPassword = (password) => {
    return bcrypt.hashSync(password, 10);
};

userSchema.methods.validatePassword = function (password) {
    return bcrypt.compareSync(password.this.Password);
};

let movie = mongoose.model('movie', movieSchema);
let user = mongoose.model('user', userSchema);

module.exports.movie = movie;
module.exports.user = user;