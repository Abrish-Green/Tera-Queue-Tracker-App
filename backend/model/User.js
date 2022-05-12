const mongoose = require("mongoose");
var uniqueValidator = require('mongoose-unique-validator');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');
var secret = process.env.JWT_SECRET;

const UserSchema = new mongoose.Schema({
  username: {
        type: String, lowercase: true, unique: true, required: true, index: true},
  password: {
        type:String},
  salt: {
        type:String},
  token: String,
}, {timestamps: true});

UserSchema.plugin(uniqueValidator, {message: 'is already taken.'});

UserSchema.methods.setPassword =  function(password){
    this.salt = crypto.randomBytes(16).toString('hex');
    this.password = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
    
  };

UserSchema.methods.generateJWT = function() {
      var today = new Date();
      var exp = new Date(today);
      exp.setDate(today.getDate() + 60);
      this.token = jwt.sign({
        id: this._id,
        username: this.username,
        exp: parseInt(exp.getTime() / 1000),
      }, secret);

      return this.token;
    };

const User = mongoose.model("User", UserSchema);

module.exports = User;