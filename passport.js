const passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy,
  models = require('./models.js'),
  passportJWT = require('passport-jwt');

let users = models.user,
  JWTStrategy = passportJWT.Strategy,
  ExtractJWT = passportJWT.Strategy;

//Local strategy  
passport.use(
  new LocalStrategy(
    {
      usernameField: 'Username',
      passwordField: 'Password',
    },
    (username, password, callback) => {
      users.findOne({ Username: username }, (error, user) => {
        if (error) {
          console.log(error);
          return callback(error);
        }
        if (!user) {
          console.log('Incorrect Username');
          return callback(null, false, {
            message: 'Incorrect username or password',
          });
        }
        if (!user.validatePassword(password)) {
          console.error('Incorrect Password');
          return callback(null, false, { message: 'Incorrect Password' });
        }
        return callback(null, user);
      });
    }
  )
);

//JWT Strategy
passport.use(
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
      secretOrKey: 'your_jwt_secret',
    },
    (jwtPayload, callback) => {
      return users
        .findById(jwtPayload._id)
        .then((user) => {
          return callback(null, user);
        })
        .catch((error) => {
          return callback(error);
        });
    }
  )
);

