const passport = require('passport');
const LocalStrategy = require('passport-local');
const bcrypt = require('bcrypt');
const { ObjectID } = require('mongodb');
// create github strategy
//authenticates users using a GitHub account and OAuth 2.0 tokens.
const GitHubStrategy = require('passport-github').Strategy;

module.exports = function (app, myDataBase) {
// persist user data (after successful authentication) into session.
passport.serializeUser((user, done) => {
    done(null, user._id);
});

  // is used to retrieve user data from session.
  passport.deserializeUser((id, done) => {
      myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
          if (err) return console.error(err);
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

  //  The client ID and secret obtained when creating an application are
  //supplied as options when creating the strategy.
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: 'https://freecodecamp-chat-app.onrender.com/auth/github/callback'
  },
  // verify callback, which receives the access token and optional refresh token
  // profile which contains the authenticated user's GitHub profile
  // callback must call cb providing a user to complete authentication.
  function (accessToken, refreshToken, profile, cb) {
    console.log(profile);
    //Database logic here with callback containing our user object
    //  allows you to search for an object and update it.
    /*
    We need to load the user's database object if it exists,
     or create one if it doesn't, and populate the fields from the profile,
     then return the user's object.
    */
    myDataBase.findOneAndUpdate(
      { id: profile.id },
      {
        $setOnInsert: {
          id: profile.id,
          username: profile.username,
          name: profile.displayName || 'John Doe',
          photo: profile.photos[0].value || '',
          email: Array.isArray(profile.emails)
            ? profile.emails[0].value
            : 'No public email',
          created_on: new Date(),
          provider: profile.provider || ''
        },
        $set: {
          last_login: new Date()
        },
        $inc: {
          login_count: 1
        }
      },
      { upsert: true, new: true },
      (err, doc) => {
        return cb(null, doc.value);
      }
    );
  }
));
}
