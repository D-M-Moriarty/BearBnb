var express = require("express"),
    app = express(),
    bodyParser = require("body-parser"),
    mongoose = require("mongoose"),
    passport = require("passport"),
    LocalStrategy = require("passport-local"),
    User = require("./models/user"),
    flash = require("connect-flash"),
    methodoverride = require("method-override");
const expressip = require('express-ip');

// Requiring Routes    
var commentRoutes = require("./routes/comments"),
    propertyRoutes = require("./routes/properties"),
    indexRoutes = require("./routes/index");

var url = "mongodb://127.0.0.1:27017/Bearbnb";
mongoose.connect(url, {
    useNewUrlParser: true
});


mongoose.Promise = global.Promise;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static(__dirname + "/public"));
app.use(methodoverride("_method"));
app.use(flash());
app.use(expressip().getIpInfoMiddleware);

// stop caching
app.use(function (req, res, next) {
    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    next();
});

// Configure Passport
app.use(require("express-session")({
    secret: "this is a secret",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function (req, res, next) {
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

app.use(indexRoutes);
app.use("/properties", propertyRoutes);
app.use("/properties/:id/comments", commentRoutes);


app.listen(3000, process.env.IP, function () {
    console.log("Bearbnb camp server has started");
});