var express = require('express');
var session = require('express-session');
var fs = require('fs');
var passport = require("passport");
var config = require("/solsort/config.json");

var app = express();
app.use(session(config.expressSession));
var server = require('http').Server(app);
server.listen(4078);

// # Login
function login(access, refresh, profile, done) { 
  return done(profile); }

function loginHandler(provider) {
    return function(req, res) {
      passport.authenticate(provider)(req, res, function(profile) { 
        if(profile.provider === "Wordpress") profile.id = profile._json.ID;
        uid = encodeURIComponent(profile.provider + "_" + profile.id);
        name = profile.displayName || profile.name;
        console.log("LOGIN", uid, JSON.stringify(profile._raw));
        res.end("Login as " + name + ": " + uid);
      });
    };
}

function addStrategy(name, Strategy, opt) {
  passport.use(new Strategy(config[name], login));
  app.get('/auth/' + name, passport.authenticate(name, opt));
  app.get('/auth/' + name + '/callback', loginHandler(name));
}


addStrategy('github', require("passport-github"));
addStrategy('twitter', require("passport-twitter"));
addStrategy('linkedin', require("passport-linkedin"));
addStrategy('google', require("passport-google-oauth").OAuth2Strategy, {scope: 'profile'});
addStrategy('facebook', require("passport-facebook"));
addStrategy('wordpress', require("passport-wordpress").Strategy, {scope: 'auth'});

// # socket.io

var io = require('socket.io')(server);
var p2pserver = require('socket.io-p2p-server').Server
io.use(p2pserver);
