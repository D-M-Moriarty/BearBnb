let express = require("express");
let router = express.Router();
// import user model
let User = require("../models/user");
let passport = require("passport");

// Root Route
router.get("/", (req, res) => {
    res.render("landing")
});

//===============
// Auth Routes
//===============

// register Route
router.get("/register", (req, res) => {
    res.render("register");
});
// sign up
router.post("/register", (req, res) => {
    // create instance of user and 
    // populate the username field with 
    // username entered through web page
    let newUser = new User({
        username: req.body.username
    });
    // the register function is a part of the passport 
    // plugin. it authenticates the user and then inserts
    // them to the database
    User.register(newUser, req.body.password, (err, user) => {
        if (err) {
            // if theres an error, e.g. the user already exists
            // redirect to the register page and notify the user
            return res.render("register", {
                "error": err.message
            });
        } else {
            // if all goes well the user is authenticated
            // and inserted to mongodb
            passport.authenticate("local")(req, res, () => {
                req.flash("success", "Welcome to Bearbnb " + user.username);
                res.redirect("/properties");
            });
        }
    })
});

// show login form
router.get("/login", (req, res) => {
    res.render("login");
});
// Login Logic
router.post("/login", passport.authenticate("local", {
    successRedirect: "/properties",
    failureRedirect: "/login",
    failureFlash: true
}), (req, res) => {});

// logout route
router.get("/logout", (req, res) => {
    req.logout();
    req.flash("success", "logged you out");
    res.redirect("/properties");
});

module.exports = router;