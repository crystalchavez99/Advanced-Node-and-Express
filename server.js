'use strict';
require('dotenv').config();
const express = require('express');
// authentication middleware for Node.js
const passport = require('passport');
const  session  = require('express-session');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');

const app = express();

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// This is used to compute the hash used to encrypt your cookie!
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.use(passport.initialize());
app.use(passport.session());

// Assigns setting name to value.
app.set('view engine', 'pug');
app.set('views', './views/pug')
app.route('/').get((req, res) => {
  // Renders a view and sends the rendered HTML string to the client. Optional parameters:
  // send the rendered view to the client
  res.render('index', {title: 'Hello', message: 'Please log in'})
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
