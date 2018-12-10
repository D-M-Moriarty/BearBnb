// all the middleware
var Property = require("../models/property");
var Comment = require("../models/comment");

var middlewareObj = {

};

middlewareObj.checkPropertyOwnership = function (req, res, next) {
    if (req.isAuthenticated()) {
        Property.findById(req.params.id, function (err, foundProperty) {
            if (err) {
                req.flash("error", "Property not found");
                res.redirect("back");
            } else {
                // if logged in does user own campground
                if (foundProperty.host.id.equals(req.user._id)) {
                    next();
                } else {
                    req.flash("error", "You dont have permission to do that");
                    res.redirect("back");
                }

            }
        });
    } else {
        req.flash("error", "You need to be logged in to do that")
        res.redirect("back");
    }

}

middlewareObj.checkCommentOwnership = function (req, res, next) {
    if (req.isAuthenticated()) {
        Comment.findById(req.params.comment_id, function (err, foundComment) {
            if (err) {
                res.redirect("back");
            } else {
                // if logged in does user own comment
                if (foundComment.author.id.equals(req.user._id)) {
                    next();
                } else {
                    req.flash("error", "You dont have permission to do that");
                    res.redirect("back");
                }

            }
        });
    } else {
        req.flash("error", "You need to be logging in to do that");
        res.redirect("back");
    }

}

middlewareObj.isLoggedIn = function (req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash("error", "You need to be logged in to do that");
    res.redirect("/login");
}

module.exports = middlewareObj;