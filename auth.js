const jwtSecret = 'your_jwt_secret';
const jwt = require('jsonwebtoken');
passport = require('passport');

require('./passport.js');

function generateJWTToken(user) {
  return jwt.sign(user, jwtSecret, {
    subject: user.Username,
    expiresIn: '7d',
    algorithm: 'HS256',
  });
}

//POST on login authentication
module.exports = (router) => {
  router.post('/login', (req, res) => {
    passport.authenticate(
      'local', { session: true },
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
          let token = generateJWTToken(user.toJSON());
          return res.json({ user, token });
        })
      }
    )(req, res)
  })
}