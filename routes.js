const bcrypt = require('bcrypt');
// authentication middleware for Node.js
const passport = require('passport');
// will check if a user is authenticated
function ensureAuthenticated(req, res, next) {
    // calling Passport's isAuthenticated method on the request which checks if req.user is defined.
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/')
}
module.exports = function (app, myDataBase) {
    app.route('/').get((req, res) => {
        res.render('index', {
            title: 'Connected to Database',
            message: 'Please log in',
            showLogin: true,
            showRegistration: true,
            showSocialAuth: true
        });
    });
    app.route('/login').post(passport.authenticate('local', { failureRedirect: '/' }), (req, res) => {
        res.redirect('/profile')
    })

    app.route('/profile').get(ensureAuthenticated, (req, res) => {
        res.render('profile', { user: req.user.username })
    })

    app.route('/logout').get((req, res) => {
        req.logout();
        res.redirect('/');
    })

    app.route('/register').post((req, res, next) => {
        // Query database with findOne
        // Hash the passwords
        const hash = bcrypt.hashSync(req.body.password, 12);
        myDataBase.findOne({ username: req.body.username }, (err, user) => {
            // If there is an error, call next with the error
            if (err) {
                next(err)
                //If a user is returned, redirect back to home
            } else if (user) {
                res.redirect('/')
            } else {
                // if a user is not found and no errors occur,
                //then insertOne into the database with the username and password.
                myDataBase.insertOne({
                    username: req.body.username,
                    password: hash
                }, (err, doc) => {
                    if (err) {
                        res.redirect('/')
                    } else {
                        // The inserted document is held within
                        // the ops property of the doc
                        // call next to go to step 2, authenticating the new user
                        next(null, doc.ops[0])
                    }
                })
            }
        })
    },
        passport.authenticate('local', { failureRedirect: '/' }),
        (req, res, next) => {
            res.redirect('/profile');
        }
    )

    app.route('/auth/github').get(passport.authenticate('github'));
    
    app.route('/auth/github/callback').post(passport.authenticate('github', {failureRedirect: '/'}), (req,res) =>{
        res.redirect('/profile')
    })

    app.use((req, res, next) => {
        res.status(404)
            .type('text')
            .send('NOT FOUND')
    })
}
