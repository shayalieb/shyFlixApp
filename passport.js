const passport = require('passport');
LocalStrategy = require('passport-local').Strategy,
  passportJWT = require('passport-jwt');
Models = require('./models.js');

let Users = Models.User,
  JWTStrategy = passportJWT.Strategy,
  ExtractJWT = passportJWT.ExtractJWT;

passport.use(new LocalStrategy(
  {
    usernameField: 'Username',
    passwordField: 'Password',
  },
  (username, password, callback) => {
    console.log(username + ' ' + password);
    Users.findOne({ Username: username }, (error, user) => {
      if (error) {
        console.log(error);
        return callback(error);
      }
      if (!user.validatePassword(password)) {
        console.log('Password is incorrect');
        return callback(null, false, {
          message: 'Password is incorrect',
        });
      }
      console.log('Finished');
      return callback(null, user);
    });
  }
));

passport.use(new JWTStrategy(
  {
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey: 'you_jwt_secret',
  },
  (jwtPayload, callback) => {
    return Users.findById(jwtPayload._id)
      .then((user) => {
        return callback(null, user);
      })
      .catch((error) => {
        return callback(error)
      });
  }
));