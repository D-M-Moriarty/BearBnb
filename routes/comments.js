var express = require("express");
var router = express.Router({
  mergeParams: true
});
var Property = require("../models/property"),
  Comment = require("../models/comment");
var middleware = require("../middleware");

//=====================
// COMMENTS ROUTES
//=====================

// comments new
router.get("/new", middleware.isLoggedIn, (req, res) => {
  //find campground by id
  Property.findById(req.params.id, (err, property) => {
    if (err) {
      console.log(err);
    } else {
      res.render("comments/new", {
        property: property
      });
    }
  });
});

// comments create
router.post("/", middleware.isLoggedIn, (req, res) => {
  // lookup property using id
  Property.findById(req.params.id, (err, property) => {
    if (err) {
      console.log(err);
      res.redirect("/properties");
    } else {
      // create a new comment on the property
      Comment.create(req.body.comment, (err, comment) => {
        if (err) {
          req.flash("error", "Something went wrong");
          console.log(err);
        } else {
          // add username and id to commment
          comment.author.id = req.user._id;
          comment.author.username = req.user.username;
          // save the comment
          comment.save();
          // add the comment to the properties array of comments
          property.comments.push(comment);
          // save the property
          property.save();
          req.flash("success", "Successfully created comment");
          res.redirect("/properties/" + property._id);
        }
      });
    }
  });
});

// edit route
router.get(
  "/:comment_id/edit",
  middleware.checkCommentOwnership,
  (req, res) => {
    // find the comment by its id
    Comment.findById(req.params.comment_id, (err, foundComment) => {
      console.log("The id is " + req.params.id);
      if (err) {
        res.redirect("back");
      } else {
        // display the edit comment page
        res.render("comments/edit", {
          property_id: req.params.id,
          comment: foundComment
        });
      }
    });
  }
);

// update route using PUT
router.put("/:comment_id", middleware.checkCommentOwnership, (req, res) => {
  // find the comment by its id and update it with the new comment supplied in the PUT request
  Comment.findByIdAndUpdate(
    req.params.comment_id,
    req.body.comment,
    (err, updatedComment) => {
      if (err) {
        res.redirect("back");
      } else {
        res.redirect("/properties/" + req.params.id);
      }
    }
  );
});

// Destroy route
router.delete("/:comment_id", middleware.checkCommentOwnership, (req, res) => {
  // find a comment by its id and remove it from the database
  Comment.findByIdAndRemove(req.params.comment_id, err => {
    if (err) {
      res.redirect("back");
    } else {
      req.flash("succes", "Comment deleted");
      res.redirect("/properties/" + req.params.id);
    }
  });
});

module.exports = router;
