'use strict';
require('dotenv').config();
const express = require('express');
// authentication middleware for Node.js
const passport = require('passport');
const  session  = require('express-session');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const { ObjectID } = require('mongodb');
const LocalStrategy = require('passport-local');


const app = express();

// Assigns setting name to value.
app.set('view engine', 'pug');
app.set('views', './views/pug')

/*
https://stackoverflow.com/questions/27637609/understanding-passport-serialize-deserialize
*/
// This is used to compute the hash used to encrypt your cookie!
// Applications must initialize session support in order to make use of login sessions.
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false }
}));


app.use(passport.initialize());
app.use(passport.session());

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// will check if a user is authenticated
function ensureAuthenticated(req,res,next){
  // calling Passport's isAuthenticated method on the request which checks if req.user is defined.
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect('/')
}
/*
Connect to the database once, when you start the server, and keep a
persistent connection for the full life-cycle of the app.
The purpose of this is to not allow requests before your database
is connected or if there is a database error
*/
myDB(async client => {
  const myDataBase = await client.db('database').collection('users');

  app.route('/').get((req, res) => {
    res.render('index', {
      title: 'Connected to Database',
      message: 'Please log in',
      showLogin: true
    });
  });

  app.route('/login').post(passport.authenticate('local',{ failureRedirect: '/' }),(req,res)=>{
    res.redirect('/profile')
  })

  app.route('/profile').get(ensureAuthenticated,(req,res)=>{
    res.render('profile', {user: req.user.username})
  })

  app.route('/logout').get((res,res)=>{
    req.logout();
    res.redirect('/');
  })

  app.use((req,res,next)=>{
    res.status(404)
    .type('text')
    .send('NOT FOUND')
  })

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
      if (password !== user.password) return done(null, false);
      // the user object is returned and they are authenticated.
      return done(null, user);
    });
  }));
}).catch(e => {
  app.route('/').get((req, res) => {

    // Renders a view and sends the rendered HTML string to the client. Optional parameters:
  // send the rendered view to the client
    res.render('index', { title: e, message: 'Unable to connect to database'});
  });
});



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
