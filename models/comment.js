let mongoose = require("mongoose");

const commentSchema = mongoose.Schema({
  text: String,
  author: {
    id: {
      // user schema
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    username: String
  },
  dateCreated: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Comment", commentSchema);
