<!-- MACHINE GENERATED - DO NOT EDIT - USE `./dev.sh` -->
# muBackend

[![Build Status](https://travis-ci.org/rasmuserik/mubackend.svg?branch=master)](https://travis-ci.org/rasmuserik/mubackend)
[![Code Climate](https://codeclimate.com/github/rasmuserik/mubackend/badges/gpa.svg)](https://codeclimate.com/github/rasmuserik/mubackend)
[![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg?style=flat-square)](https://github.com/Flet/semistandard)
[![Dependency Status](https://david-dm.org/rasmuserik/mubackend.svg?style=flat-square)](https://david-dm.org/rasmuserik/mubackend)
[![npm](https://img.shields.io/npm/v/mubackend.svg)](https://www.npmjs.com/package/mubackend)
[![npm](https://img.shields.io/npm/l/mubackend.svg)]()

Literate programming: This documentation _is_ and contains the entire source code.

# Under development, not done yet!

MuBackend is a noBackend backend, <br>
primarily for single page applications. <br> 
Intended features:

- *Authentication* of users through different providers
- *Synchronization*  of user data across different clients/devices
- *Communication* sending messages between users

The design criterias are: *simplicity* and *scaleability*. <br>
This README.md, contains the *entire* source code, <br>
both for the client and the server. <br>
This implementation prioritises simplicity<br>
over scaleability, but all of the API/algorithms<br>
can be implemented with web-scale performance.

# API 

API is under implementation

## Initialisation

- `mu = new MuBackend(url)`
- `mu.userId` - a string that identifies the user, if currently logged in
- `mu.signIn(userId, password)` - login with username/password
- `mu.signInWith(provider)` - login with a given provider, providers can be: "github", "twitter", "linkedin", "google", "facebook", or "wordpress". Typically called when the user clicks on a log-in button. *The user leaves the page and will be redirected home to `location.href` when done*
- `mu.signOut()`

## Storage

MuBackend allows creation of sync-endpoints for PouchDB. 

- `mu.createDB(dbName, public)` - allocates a new online database, owned by the current user. If `public` is true, then it will be readable by anyone. Otherwise it will only be readable by the current user.
- `mu.newPouchDB(dbName, [userId])` - returns a new PouchDB online database connected to a named db belonging to a given user. It will be read-only, unless userID is the current user. `PouchDB` is the PouchDB constructor. This is often just used for replication to/from a locally cached PouchDB.

## Messaging 

- `mu.send(user, inbox, message)` - put an object to an inbox owned by a given user
- `mu.inbox(inbox)` - get a pouchdb representing an inbox

# Roadmap

## Changelog

- 0.1.0 Initial working version, supports login, database creation+access, and inter-user messaging, very unpolished.

## Backlog

- 0.2
  - √common.js with db-url - no promise on create
  - √remove messaging, REST instead of socket.io, (for mobile battery performance)
  - √send/inbox api
  - √icon
  - demo site
  - automated test
  - better documentation
- later
  - Guide to install/self-host
  - Docker
  - Announce
  - video tutorial
  - example page for experimentation
  - `mu.findTagged(tag)` -> list of user-ids with given tag
  - `mu.tagSelf(tag, true/false)` -> register/deregister current user as having a tag
   - Sample applications


## Versions

Even minor versions are releases, odd minor versions are development. Semi-semver

<!--
# Naming etc.
## The name

mu is the SI-prefix for micro, ie. a micro-backend, or no-backend.

A developer was laying in a hammock, pondering about backends.
Then a cow came by and said "MU", and suddenly the develper was enlightened.

## Nanos gigantum humeris insidentes

*If I have seen further, it is by standing on the shoulders of giants.* - Isaac Newton

muBackend is just the empty space between the following technologies:

- Passport for authentication
- CouchDB for syncing PouchDB, at hosting data
- Socket.io and Socket.io-p2p for communication between clients

## Files

- README.md - README: a concatenation of the source file as literate code.
- `muBackend.js` project documentation, sample usage
- `client.js` the client side library
- `mubackend.js the server side code
- `dev.sh` shell script used during development, which autoruns/restarts the server and generates README.md
- `config.sample.json` sample config file, the filename should be added as an argument when running `dev.sh` or `mubackend.js`

-->

# Installation

Dev-dependency on ubuntu linux: `apt-get install inotify-tools couchdb npm`

# example.js


    window.mu = new window.MuBackend('https://api.solsort.com/');
    document.getElementById('userid').innerHTML = mu.userId;

    mu.createDB('example', true, function(err) {
      var p = mu.newPouchDB('example');
      p.get("counter", function(err, o) {
        o = o || {_id: 'counter', value: 0};
        document.getElementById('counter').innerHTML = o.value;
        ++o.value;
        p.put(o);
      });
    });

# index.html

The html code, used for the example above, is:

    <!DOCTYPE html>
    <html>
      <head><meta charset="UTF-8"><title>muBackend example - μ無</title></head>
      <body>
        <p><b>muBackend examples</b>, see <a href=https://github.com/rasmuserik/mubackend>github:rasmuserik/mubackend</a> for more info.</p>
        <p>This demo support signin, plus database access, demonstrated by incrementing a value in an object in the user-owned hosted database.</p>

        <p>Sign in with:
        <button onclick="mu.signInWith('github');">github</button>
        <button onclick="mu.signInWith('twitter');">twitter</button>
        <button onclick="mu.signInWith('google');">google</button>
        <button onclick="mu.signInWith('facebook');">facebook</button>
        <button onclick="mu.signInWith('linkedin');">linkedin</button>
        <button onclick="mu.signInWith('wordpress');">wordpress</button>
        </p><p><button onclick="mu.signOut();location.reload();">Sign out</button>
        <p>Current login: <span id=userid></span></p>
        <p>Counter in database: <span id=counter></span></p>

        <script src=https://cdn.jsdelivr.net/pouchdb/5.1.0/pouchdb.min.js></script>
        <script src=mu.min.js></script>
        <script src=example.js></script>
      </body>
    </html>

# common.js

Shared code between client and server

    exports.dbName = function(user, id) {
      return ('mu_' + user.replace(/_/g, '-') + '_' + encodeURIComponent(id))
        .toLowerCase().replace(/[^a-z0-9_$()+-]/g, '$');
    }

# client.js

    var PouchDB = window.PouchDB

## Initialisation



    window.MuBackend = function MuBackend(url) {
      var self = this;
      var loginFn;
      url = url + (url[url.length -1] === '/' ? "" : "/");
      this._url = url;
      this.userId = window.localStorage.getItem('mubackend' + url + 'userId');
      this._token = window.localStorage.getItem('mubackend' + url + '_token');
      if(/*!this.userId &&*/ window.location.href.indexOf("muBackendLoginToken=") !== -1) {
        var token = window.location.href.replace(/.*muBackendLoginToken=/, "");
        this._rpc('loginToken', token, function(result) {
          result = result || {};
          if(result.user && result.token) {
            self._signIn(result.user, result.token);
            window.location.href = window.location.href.replace(/muBackendLoginToken=.*/, "");
            window.location.reload();
          } 
        });
      }
    };

    MuBackend.prototype._rpc = function(name) {
      var args = Array.prototype.slice.call(arguments, 1);
      var cb = args[args.length - 1];
      var xhr = new XMLHttpRequest();
      xhr.open("POST", this._url + "mu/" + name);
      xhr.send(JSON.stringify(args.slice(0, -1)));
      xhr.onreadystatechange = function() {
        if(xhr.readyState === XMLHttpRequest.DONE) {
          if(xhr.status === 200) {
            console.log(xhr.responseText);
            cb.apply(null, JSON.parse(xhr.responseText));
          } else {
            cb("HTTP-error: " + xhr.status);
          }
        }
      };
    }
    MuBackend.prototype._signIn = function(userId,_token) {
      window.localStorage.setItem('mubackend' + this._url + 'userId', (this.userId = userId) || "");
      window.localStorage.setItem('mubackend' + this._url + '_token', (this._token = _token) || "");
    }
    MuBackend.prototype.signIn = function(userId, password) {
      var self = this;
      this._rpc('loginPassword', userId, password, function(err) {
        if(!err) {
          self._signIn(userId, password);
        }
      });
    };
    MuBackend.prototype.signInWith = function(provider) {
      window.location.href = this._url + 'auth/' + provider + '?' + window.location.href;
    };
    MuBackend.prototype.signOut = function () {
      this._signIn(undefined, undefined, undefined);
    };
## Storage

    MuBackend.prototype.createDB = function(dbName, isPublic, cb)  {
      this._rpc('createDB', this.userId, dbName, !isPublic, this._token, cb || function() {});
    };
    MuBackend.prototype.newPouchDB = function(dbName, userId)  {
      userId = userId || this.userId;
      var url = this._url + "db/" + require('./common.js').dbName(userId, dbName);
      if(this.userId) {
            url = url.replace('//', '//' +  this.userId + ':' + this._token + '@');
      }
      return new PouchDB(url);
    };
## Messaging
### Inbox
    MuBackend.prototype.send = function(user, inbox, message, cb) {
      this._rpc('send', user, inbox, message, cb || function() {});
    };
    MuBackend.prototype.inbox = function(inbox) {
      this.createDB("inbox_" + inbox);
      return this.newPouchDB("inbox_" + inbox);
    };
## Directory

    MuBackend.prototype.findTagged = function(tag) {
      console.log("TODO: findTagged");
    }
    MuBackend.prototype.tagSelf = function(tag, t) {
      console.log("TODO: tagSelf");
    }

# mubackend.js 

## Load config

    var configFile = process.argv[process.argv.length - 1];
    if (configFile.slice(-5) !== '.json') {
      console.log('Error: backend needs .json config file as argument.');
      process.exit(-1);
    }
    var config = require(configFile);
### Default configuration

    config.port = config.port || 4078;

## start express server
    var app = require('express')();
    app.use(require('express-session')(config.expressSession));
    app.use(function (req, res, next) {
        res.setHeader("Access-Control-Allow-Origin", "*");
        return next();
    });
    var server = require('http').Server(app);
    server.listen(config.port);
## Util

    var crypto = require('crypto');
    var btoa = require('btoa');
    var dbName = require('./common.js').dbName;
    function uniqueId () { return btoa(crypto.randomBytes(12)); }
    function jsonOrNull(str) { try { return JSON.parse(str);} catch(_) { return undefined; }}
## CouchDB

    var request = require('request');
    var couchUrl = config.couchdb.url.replace('//', '//' +
        config.couchdb.user + ':' + config.couchdb.password + '@');
    function getUser (user, callback) {
      request.get(couchUrl + '_users/org.couchdb.user:' + user,
          function (err, response, body) {
            callback(err ? {error: 'request error'} : JSON.parse(body));
          });
    }
    function createUser (user, password, meta) { // ###
      request.put({
        url: couchUrl + '_users/org.couchdb.user:' + user,
        json: {
          name: user,
          meta: meta,
          password: password,
          plain_pw: password,
          roles: [],
          type: 'user'
        }
      }, function (err, __, body) {
      });
    }
    function createDatabase (user, id, isPrivate, callback) { // ###
      var name = dbName(user, id);
      request.put({
        url: couchUrl + name,
        json: {}
      }, function (err, _, body) {
        callback(err || body.error);
        if (isPrivate) {
          request.put({
            url: couchUrl + name + '/_security',
            json: {'admins': { 'names': [], 'roles': [] },
              'members': {'names': [user], 'roles': []}}
          }, function (err, _, body) {
            if (err || body.error) console.log('createDatabaseSecurityError:', name, body);
          });
        } else {
          request.put({
            url: couchUrl + name + '/_design/readonly',
            json: {
              validate_doc_update: 'function(_1, _2, user){if(user.name!=="' + 
                                       user + '")throw "Forbidden";}'
            }
          }, function (err, _, body) {
            if (err || body.error) console.log('createDatabaseDesignError:', name, body);
          });
        }
      });
    }
    function validateUser(user, password, callback) { // ###
      request.get(couchUrl + '_users/org.couchdb.user:' + user, function (err, _, body) {
        var body = jsonOrNull(body) || {};
        if (err || password !== body.plain_pw) { callback("Login error"); } else { callback(); }
      });
    }
## Login

    var passport = require('passport');
    var loginRequests = {};

    function loginHandler (provider) {
      return function (req, res) {
        passport.authenticate(provider)(req, res, function (profile) {
          if (profile.provider === 'Wordpress') profile.id = profile._json.ID;
          var user = encodeURIComponent(profile.provider + '_' + profile.id);
          if (!profile.id) {
            return res.redirect(app);
          }
          getUser(user, function (o) {
            var pw;
            if (!o.error) {
              pw = o.plain_pw;
            } else {
              pw = uniqueId();
              profile._json.loginProvider = provider;
              createUser(user, pw, profile._json);
            }

            var token = uniqueId();
            var app = req.session.app;
            loginRequests[token] = {user: user, token: pw, time: Date.now()};
            if (app.indexOf('#') === -1) {
              app += '#';
            }
            res.redirect(app + 'muBackendLoginToken=' + token);
          });
        });
      };
    }

    function login (access, refresh, profile, done) {
      return done(profile);
    }
    function addStrategy (name, Strategy, opt) {
      passport.use(new Strategy(config[name], login));
      var callbackName = 'auth/' + name + '/callback'
        config[name].callbackURL = config[name].callbackURL || config.url + callbackName;
      app.get('/auth/' + name,
          function (req, res) {
            req.session.app = req.url.replace(/^[^?]*./, '');
            return passport.authenticate(name, opt)(req, res);
          });
      app.get('/' + callbackName, loginHandler(name));
    }

    addStrategy('github', require('passport-github'));
    addStrategy('twitter', require('passport-twitter'));
    addStrategy('linkedin', require('passport-linkedin'));
    addStrategy('google', require('passport-google-oauth').OAuth2Strategy, {scope: 'profile'});
    addStrategy('facebook', require('passport-facebook'));
    addStrategy('wordpress', require('passport-wordpress').Strategy, {scope: 'auth'});

## HTTP-api
    function handleHttp(name, f) { // ###
      app.all('/mu/' + name, function(req, res) {
        console.log('/moo', name);
        req.pipe(require('concat-stream')(function(body) {
          f.apply(null, (jsonOrNull(body) || []).concat([function(){
            res.end(JSON.stringify(Array.prototype.slice.call(arguments, 0)));
          }]));
        }));
      });
    };
    handleHttp('loginPassword', validateUser); // ###
    handleHttp('loginToken', function (token, f) { // ###
      f(loginRequests[token]);
      delete loginRequests[token];
    });
    handleHttp('createDB', function (user, db, isPrivate, password, f) { // ###
      validateUser(user, password, function(err) {
        if(err) { f(err); } else { createDatabase(user, db, isPrivate, f); }
      });
    });
    handleHttp('send', function(user, inbox, msg, f) {  // ###
      request.put({ url: couchUrl + dbName(user, "inbox_" + inbox) + "/" + Date.now(), json: msg}, 
          function(err, _, body) {
            f(err, body);
          });
    });
## CORS

    app.get('/cors/', function (req, res) {
      request.get(req.url.replace(/^[^?]*./, ''), function (_, __, body) {
        res.header('Content-Type', 'text/plain');
        res.end(body);
      });
    });

## Hosting of static resources

    app.use('/mu/', require('express').static('./'));
## create users from configfile
    (function() {
      for(var user in config.createUsers) { createUser(user, config.createUsers[user]); }
    })();

