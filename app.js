
require('dotenv').config();
const express = require("express");
const request = require("postman-request");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require ("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");
const FacebookStrategy = require('passport-facebook');


const app = express();

app.set("view engine", "ejs");  //to use embedded javascript templates instead of html files
// app.set('Cache-Control', 'no-store');
app.use(express.static("public")); //to serve static files
app.use(express.urlencoded({ extended: true })); // to req input data in forms (ejs or html) with req.body.

app.use (session({
    secret: process.env.LOCAL_SECRET,
    resave: false,
    saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://0.0.0.0:27017/userDB");

//a)Schema
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    facebookId: String
});

userSchema.plugin(passportLocalMongoose); //hash and salt passwords, and save users in mongoDB database.
userSchema.plugin(findOrCreate);

//b)Model
const User = mongoose.model("User", userSchema); 

passport.use(User.createStrategy());
passport.serializeUser(function (User, done) {
    done(null, User.id);
});
passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, User) {
        done(err, User);
    });
});

/////////// Strategies ///////////

passport.use(new GoogleStrategy({
    clientID: process.env.G_CLIENT_ID,
    clientSecret: process.env.G_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
},
    function (accessToken, refreshToken, profile, cb) {
        console.log(profile);

        User.findOrCreate({ googleId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));

passport.use(new FacebookStrategy({
    clientID: process.env.FB_CLIENT_ID,
    clientSecret: process.env.FB_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
},
    function (accessToken, refreshToken, profile, cb) {
        console.log(profile);

        User.findOrCreate({ facebookId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));

app.get("/", function (req, res) {
    res.render("home");
});


/////////// Google ///////////

app.get("/auth/google",
  passport.authenticate('google', { scope: ['profile'] }));

app.get("/auth/google/secrets",
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect("/secrets");
    });


/////////// Facebook ///////////
app.get("/auth/facebook",
    passport.authenticate('facebook'));

app.get("/auth/facebook/secrets",
    passport.authenticate('facebook', { failureRedirect: '/login', failureMessage: true }),
        function (req, res) {
            res.redirect('/secrets');
        });


//////////////////////////

app.get("/login", function (req, res) {
    res.render("login");
});

app.get("/register", function (req, res) {
    res.render("register");
});

app.get("/secrets", (req, res) => {
    if (req.isAuthenticated()){
        res.render("secrets");
    } else {
        res.redirect("/login");
    }
});

app.get('/logout', (req,res) => {
    req.logout( (err) => {
        if (err) {
            console.log(err);
        } else {
            res.redirect('/');
        }
    });
});

app.post('/register', (req, res) =>{   
    
    User.register({username: req.body.username}, req.body.password, (err, user) => {
        if (err) {
            console.log(err);
            res.redirect('/register');
        } else {
            passport.authenticate("local")(req,res, ()=> {
                res.redirect("/secrets");
            })
        }
    })
   
})

app.post('/login', (req, res) => {

    const user = new User ({
        username: req.body.user,
        password: req.body.password
    });
        
    req.login(user, function(err){
        if (err){
            console.log(err);
        } else {
            passport.authenticate("local") (req, res, () => {
                res.redirect("/secrets");
            });
        }
    });

});


app.listen(3000, function () {
    console.log("Server started on port 3000");
});