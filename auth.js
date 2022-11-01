const jwtSecret = 'your_jwt_secret';

const jwt = require('jsonwebtoken');

const passport = require('passport');
require('./passport');

let generateJWTToken = (user) => {
    return jwt.sign(user, jwtSecret, {
        subject: user.Username,
        expiresIn: "7d",
        algorithm: 'HS256'
    });
}
    
// module.exports = (router) => {
//   router.post('/login', (req, res) => {
//     console.log('error', req.body);
//     passport.authenticate('local', { session: false }, (error, user, info) => {
//       if (error || !user) {
//         return res.status(400).json({
//           message: 'Something is not right',
//           user: user
//         });
//       }
//       req.login(user, { session: false }, (error) => {
//         if (error) {
//           res.send(error);
//         }
//         let token = generateJWTToken(user.toJSON());
//         return res.json({ user, token });
//       });
//     })(req, res);
//   });
// }

module.exports = (router) => {
  router.post('/login', (req, res) => {
      console.log('udfk', req.body);

      // eslint-disable-next-line consistent-return
      passport.authenticate('local', { session: false }, (error, user, info) => {
          console.log('udfk', req.body);

          if (error || !user) {
              return res.status(400).json({
                  message: 'SOmething is wrong',
                  user
              });
          }
          req.login(user, { session: false }, (error) => {
              if (error) {
                  res.send(error);
              }
              console.log(user);
              // eslint-disable-next-line prefer-const
              let token = genterateJWTToken(user.toJSON());
              return res.json({ user, token });
          });
      })(req, res);
  });
};