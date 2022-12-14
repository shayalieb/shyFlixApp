const passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy,
  Models = require('./models.js'),
  passportJWT = require('passport-jwt');

let Users = Models.User,
  JWTStrategy = passportJWT.Strategy,
  ExtractJWT = passportJWT.ExtractJwt;

passport.use(
  new LocalStrategy(
    {
      usernameField: 'Username',
      passwordField: 'Password',
    },
    (username, password, callback) => {
      console.log(username + '  ' + password);
      Users.findOne({ Username: username }, (error, user) => {
        if (error) {
          console.log(error);
          return callback(error);
        }

        if (!user) {
          console.log('incorrect username');
          return callback(null, false, {
            message: 'Incorrect username or password.',
          });
        }

        if (!user.validatePassword(password)) {
          console.log('incorrect password');
          return callback(null, false, {
            message: 'Incorrect password.',
          });
        }
        console.log('finished');
        return callback(null, user);
      });
    }
  )
);

passport.use(
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
      secretOrKey: 'your_jwt_secret',
    },
    async (jwtPayload, callback) => {
      try {
        const user = await Users.findById(jwtPayload._id);
        return callback(null, user);
      } catch (error) {
        return callback(error);
      }
    }
  )
);
// const passport = require('passport'),
//   LocalStrategy = require('passport-local').Strategy,
//   models = require('./models.js'),
//   passportJWT = require('passport-jwt');

// let users = models.User,
//   JWTStrategy = passportJWT.Strategy,
//   ExtractJWT = passportJWT.ExtractJWT

// //Checking the database for the credentials
// passport.use(new LocalStrategy({
//   usernameField: 'Username',
//   passwordField: 'Password'
// }, (username, password, callback) => {
//   console.log(username + ' ' + password);
//   users.findOne({ Username: username }, (error, user) => {
//     if (error) {
//       console.log(error);
//       return callback(error);
//     }
//     //If username cannot be found?
//     if (!user) {
//       console.log('Username is incorrect');
//       return callback(null, false, { message: 'The username is incorrect' });
//     }
//     //validate the password that the user enters
//     if (!user.validatePassword(password)) {
//       console.log('Incorrect password');
//       return callback(null, false, { message: 'Incorrect password' });
//     }

//     console.log('Finished')
//     return callback(null, user)
//   });
// }));

// //jwt is extracted from the header of the http request. jwt is called bearer token
// passport.use(new JWTStrategy({
//   jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
//   secretOrKey: 'your_jwt-secret'
// }, (jwtPayload, callback) => {
//   return users.findById(jwtPayload._id)
//     .then((user) => {
//       return callback(null, user);
//     })
//     .catch((error) => {
//       return callback(error)
//     });
// }));