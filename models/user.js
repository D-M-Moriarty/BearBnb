let mongoose = require("mongoose");
let passportLocalMongoose = require("passport-local-mongoose");

const UserSchema = new mongoose.Schema({
    username: String,
    password: String
});
// passport used to create cryptic hash to be inserted to the database
// Passport is an authentication middleware for Express applications
UserSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("User", UserSchema);