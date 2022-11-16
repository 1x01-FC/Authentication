
require('dotenv').config();
const express = require("express");
const request = require("postman-request");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require ("passport-local-mongoose");


const app = express();

app.set("view engine", "ejs");  //to use embedded javascript templates instead of html files
// app.set('Cache-Control', 'no-store');
app.use(express.static("public")); //to serve static files
app.use(express.urlencoded({ extended: true })); // to req input data in forms (ejs or html) with req.body.

app.use (session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://0.0.0.0:27017/userDB");

//a)Schema
const userSchema = new mongoose.Schema({
    email: { type: String },
    password: { type: String },
});

userSchema.plugin(passportLocalMongoose);

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


app.get("/", function (req, res) {
    res.render("home");
});

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