const jwtSecret = 'your_jwt_secret';
const jwt = require('jsonwebtoken');
passport = require('passport');

require('./passport.js');

// function generateJWTToken(user) {
//   return jwt.sign(user, jwtSecret, {
//     subject: user.Username,
//     expiresIn: '7d',
//     algorithm: 'HS256',
//   });
// }

genToken = user => {
  return jwt.sign({
    iss: 'your_jwt-secret',
    sub: user.id,
    iat: new Date().getTime(),
    exp: new Date().setDate(new Date().getDate() + 1)
  }, 'your_jwt-secret');
}

//POST on login authentication
module.exports = (router) => {
  router.post('/login', (req, res) => {
    passport.authenticate(
      'local', { session: false },
      (error, user, info) => {
        if (error || !user) {
          res.status(400).json({
            error: info,
            message: 'Something is not right!',
            user: user,
          });
          return res;
        }
        req.login(user, { session: false }, (error) => {
          if (error) {
            res.send(error);
          }
          let token = genToken(user.toJSON());
          return res.json({ user, token });
        })
      }
    )(req, res)
  })
}