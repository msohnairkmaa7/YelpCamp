const mongoose=require("mongoose");
const passportLoaclMongoose = require("passport-local-mongoose");

const UserSchema = new mongoose.Schema({
    username: String,
    password: String
});

UserSchema.plugin(passportLoaclMongoose);

module.exports = mongoose.model("User",UserSchema);