var express = require('express');
var session = require('express-session');
var crypto = require('crypto');
var fs = require('fs');
var passport = require("passport");
var config = require("/solsort/config.json");
var btoa = require("btoa");
request = require("request");

var app = express();
app.use(session(config.expressSession));
var server = require('http').Server(app);
var io = require('socket.io')(server);
var p2pserver = require('socket.io-p2p-server').Server;
io.use(p2pserver);

server.listen(4078);

// # Util

function uid() { return btoa(crypto.randomBytes(12)); }

// # CouchDB
var couchUrl = "http://" + config.couchdb.user + ":" + 
                  config.couchdb.password + "@localhost:5984/";
function getUser(user, callback) {
  request.get(couchUrl + '_users/org.couchdb.user:' + user, 
    function(err, response, body) {
      callback(err?{error:"request error"}:JSON.parse(body));
    });
}
function createUser(user, fullname, password) {
  request.put({
    url: couchUrl + '_users/org.couchdb.user:' + user,
    json: {
      name: user, 
      fullname: fullname,
      password: password,
      plain_pw: password,
      roles: [], 
      type: "user"
    }
 }, function(err, _, body) {
   console.log("createUser:", user, body);
 });
}

// # Login
var loginRequests = {};

function loginHandler(provider) {
    return function(req, res) {
      passport.authenticate(provider)(req, res, function(profile) { 
        if(profile.provider === "Wordpress") profile.id = profile._json.ID;
        var user = encodeURIComponent(profile.provider + "_" + profile.id);
        console.log("LOGIN", user, JSON.stringify(profile._raw));

        if(!profile.id) {
          return res.redirect(app);
        }
        getUser(user, function(o) {
          var pw;
          if(!o.error) {
            pw = o.plain_pw;
          } else {
            pw = uid();
            createUser(user,profile.displayName || profile.name, pw);
          }

          var token = uid();
          var app = req.session.app;
          loginRequests[token] = {user: user, password: pw};
          res.redirect(app + "solsortLoginToken=" + token);
        });
      });
    };
}

function login(access, refresh, profile, done) { return done(profile); }
function addStrategy(name, Strategy, opt) {
  passport.use(new Strategy(config[name], login));
  app.get('/auth/' + name, 
      function(req, res) {
        req.session.app = req.query.app
        return passport.authenticate(name, opt)(req, res);
      });
  app.get('/auth/' + name + '/callback', loginHandler(name));
}


addStrategy('github', require("passport-github"));
addStrategy('twitter', require("passport-twitter"));
addStrategy('linkedin', require("passport-linkedin"));
addStrategy('google', require("passport-google-oauth").OAuth2Strategy, {scope: 'profile'});
addStrategy('facebook', require("passport-facebook"));
addStrategy('wordpress', require("passport-wordpress").Strategy, {scope: 'auth'});
