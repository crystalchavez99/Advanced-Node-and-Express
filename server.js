'use strict';
require('dotenv').config();
const express = require('express');
// authentication middleware for Node.js
const passport = require('passport');
const session = require('express-session');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const { ObjectID } = require('mongodb');
const LocalStrategy = require('passport-local');
const bcrypt = require('bcrypt');
const routes = require('./routes.js');
const auth = require('./auth.js')
// create github strategy
//authenticates users using a GitHub account and OAuth 2.0 tokens.
const GitHubStrategy = require('passport-github').Strategy;




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
// http server is mounted on the express app
const http = require('http').createServer(app);
const io = require('socket.io')(http);

/*
Connect to the database once, when you start the server, and keep a
persistent connection for the full life-cycle of the app.
The purpose of this is to not allow requests before your database
is connected or if there is a database error
*/
myDB(async client => {
  const myDataBase = await client.db('database').collection('users');
  routes(app, myDataBase);
  auth(app, myDataBase);
  io.on('connection', socket => {
    console.log('A user has connected');
  });
}).catch(e => {
  app.route('/').get((req, res) => {
    // Renders a view and sends the rendered HTML string to the client. Optional parameters:
    // send the rendered view to the client
    res.render('index', { title: e, message: 'Unable to connect to database' });
  });
});



const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
