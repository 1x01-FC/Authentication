
require('dotenv').config();
const express = require("express");
const request = require("postman-request");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const md5 = require("md5");

const app = express();

app.set("view engine", "ejs");  //to use embedded javascript templates instead of html files
app.use(express.static("public")); //to serve static files
app.use(express.urlencoded({ extended: true })); // to req input data in forms (ejs or html) with req.body.

mongoose.connect("mongodb://0.0.0.0:27017/userDB");

//a)Schema
const userSchema = new mongoose.Schema({
    email: { type: String },
    password: { type: String },
})

//b)Model
const User = mongoose.model("User", userSchema); 




app.get("/", function (req, res) {
    res.render("home");
});

app.get("/login", function (req, res) {
    res.render("login");
});

app.get("/register", function (req, res) {
    res.render("register");
});


app.post('/register', (req, res) =>{
    //c)CreateDocuments
    const newUser = new User({
        email: req.body.username,
        password: md5(req.body.password)
    });

    newUser.save((err, result) => err ? 
        console.log(err) :
        res.render('secrets')
    );
})

app.post('/login', (req, res) => {
    const username = req.body.username;
    const password = md5(req.body.password);

    User.findOne({email: username}, (err, i) => {
        if (err) {
            console.log(err);
        } else {
            if (i) {
                if (i.password === password) {
                    res.render('secrets');
                }
            }
        }
    });
});


app.listen(3000, function () {
    console.log("Server started on port 3000");
});