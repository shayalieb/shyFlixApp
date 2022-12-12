const passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy,
  models = require('./models.js'),
  passportJWT = require('passport-jwt');

let users = models.user,
  JWTStrategy = passportJWT.Strategy,
  ExtractJWT = passportJWT.ExtractJWT

//Checking the database for the credentials
passport.use(new LocalStrategy({
  usernameField: 'Username',
  passwordField: 'Password'
}, (username, password, callback) => {
  console.log(username + ' ' + password);
  users.findOne({ Username: username }, (error, user) => {
    if (error) {
      console.log(error);
      return callback(error);
    }
    //If username cannot be found?
    if (!user) {
      console.log('Username is incorrect');
      return callback(null, false, { message: 'The username is incorrect' });
    }
    //validate the password that the user enters
    if (!user.validatePassword(password)) {
      console.log('Incorrect password');
      return callback(null, false, { message: 'Incorrect password' });
    }

    console.log('Finished')
    return callback(null, user)
  });
}));

//jwt is extracted from the header of the http request. jwt is called bearer token
passport.use(new JWTStrategy({
  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
  secretOrKey: 'your_jwt-secret'
}, (jwtPayload, callback) => {
  return users.findById(jwtPayload._id)
    .then((user) => {
      return callback(null, user);
    })
    .catch((error) => {
      return callback(error)
    });
}));