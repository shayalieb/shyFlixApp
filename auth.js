const jwtSecret = 'your_jwt_secret';
const jwt = require('jsonwebtoken');
const passport = require('passport');
require('./passport');


/**
 * Configure the web token 
 * // This line generates a JSON Web Token (JWT) using the user's information and the secret key
 * @param {*} user 
 * @returns a token to be used by the user
 */
let generateJWTToken = (user) => {
  return jwt.sign(user, jwtSecret, {
    subject: user.Username,
    expiresIn: '7d',
    algorithm: 'HS256'
  });
};




/**
 * POST on login authentication
 * Initialize Express middleware to parse incoming request bodies in a middleware before your handlers
 * @param {*} router 
 */
module.exports = (router) => {
  router.post('/login', (req, res) => {
    passport.authenticate('local', { session: false }, (error, user, info) => {
      if (error || !user) {
        console.error(error);
        return res.status(400).json({
          message: 'Username or password is incorrect',
          user: user,
        });
      }
      req.login(user, { session: false }, (error) => {
        if (error) {
          res.send(error);
        }
        let token = generateJWTToken(user.toJSON());
        return res.json({ user, token });
      });
    })(req, res);
  });
};