const passport = require('passport');
const LocalStrategy = require('passport-local');
const bcrypt = require('bcrypt');
const { ObjectID } = require('mongodb');

module.exports = function (app, myDataBase) {
// persist user data (after successful authentication) into session.
passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  // is used to retrieve user data from session.
  passport.deserializeUser((id, done) => {
    myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
      done(null, doc);
    });
  });

  // This is defining the process to use when you try to authenticate someone locally
  passport.use(new LocalStrategy((username, password, done) => {
    // tries to find a user in your database with the username entered
    myDataBase.findOne({ username: username }, (err, user) => {
      console.log(`User ${username} attempted to log in.`);
      if (err) return done(err);
      if (!user) return done(null, false);
      //it checks for the password to match.
      if (!bcrypt.compareSync(password, user.password)) {
        return done(null, false);
      }
      // the user object is returned and they are authenticated.
      return done(null, user);
    });
  }));
}
