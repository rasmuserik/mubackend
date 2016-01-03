<!-- MACHINE GENERATED - DO NOT EDIT - USE `./dev.sh` -->
# muBackend.js
[![Build Status](https://travis-ci.org/rasmuserik/mubackend.svg?branch=master)](https://travis-ci.org/rasmuserik/mubackend)
[![Code Climate](https://codeclimate.com/github/rasmuserik/mubackend/badges/gpa.svg)](https://codeclimate.com/github/rasmuserik/mubackend)
[![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg?style=flat-square)](https://github.com/Flet/semistandard)
[![Dependency Status](https://david-dm.org/rasmuserik/mubackend.svg?style=flat-square)](https://david-dm.org/rasmuserik/mubackend)
[![npm](https://img.shields.io/npm/v/mubackend.svg)](https://www.npmjs.com/package/mubackend)
[![npm](https://img.shields.io/npm/l/mubackend.svg)]()

# Under development, not done yet!

MuBackend is a noBackend backend, <br>
primarily for single page applications. <br> 
Intended features:

- *Authentication* of users through different providers
- *Synchronization*  of user data across different clients/devices
- *Communication* between users, both messaging and discovery

The design criterias are: *simplicity* and *scaleability*. <br>
This README.md, contains the *entire* source code, <br>
both for the client and the server. <br>
This implementation prioritises simplicity<br>
over scaleability, but all of the API/algorithms<br>
can be implemented with web-scale performance.

# API 

API is under implemntation

## Initialisation

- `mu = new MuBackend(url)`
- `mu.userId` - a string that identifies the user, if currently logged in
- `mu.signIn(userId, password)` - login with username/password
- `mu.signInWith(provider)` - login with a given provider, providers can be: "github", "twitter", "linkedin", "google", "facebook", or "wordpress". Typically called when the user clicks on a log-in button. *The user leaves the page and will be redirected home to `location.href` when done*
- `mu.signOut()`

## Storage

MuBackend allows creation of sync-endpoints for PouchDB. 

- `mu.createDB(dbName, public)` - allocates a new online database, owned by the current user. If `public` is true, then it will be readable by anyone. Otherwise it will only be readable by the current user. Returns promise.
- `mu.newPouchDB(userId, dbName, PouchDB)` - returns promise of a new PouchDB online database connected to a named db belonging to a given user. It will be read-only, unless userID is the current user. `PouchDB` is the PouchDB constructor. This is often just used for replication to/from a locally cached PouchDB.

## Messaging

Communications between peers happens through channels. The channel id consists of an owner and a name, separated by ":". Anybody can write to a channel, but only the owner can listen. There is a special owner "*", which also allows everybody to listen. The API is inspired by socket.io/node.js.

- `mu.on(mu.userId + ":someChannel", f)` or `mu.on("*:someChannel", f)` - listen to events
- `mu.on('connect', f)` and `mu.on('disconnect', f)` - get notified on connect/disconnect
- `mu.removeListener(id, f)` stop listening
- `mu.emit(message-chan, message)` - emit to all listeners if connected
- `mu.emitOnce(message-chan, message)` - emit to one random listener if connected

## Events

- `connect` and `disconnect` when connected to mubackend.
- `signin`, `signout`

# Roadmap

## Changelog

- 0.1.0 Initial working version, supports login, database creation+access, and inter-user messaging, very unpolished.

## Backlog

- 0.2
  - automated test
  - demo site
  - better documentation
- later
  - Guide to install/self-host
  - Docker
  - Announce
  - video tutorial
  - example page for experimentation
  - `mu.findTagged(tag)` -> promise of list of user-ids with given tag
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
- `server.js the server side code
- `dev.sh` shell script used during development, which autoruns/restarts the server and generates README.md
- `config.sample.json` sample config file, the filename should be added as an argument when running `dev.sh` or `server.js`

-->

# Installation

Dev-dependency on ubuntu linux: `apt-get install inotify-tools couchdb npm`

# Sample usage

    window.mu = new window.MuBackend('https://api.solsort.com/');
# client.js
We load socket.io as a static dependency, such that we can load it when offline, and it will go online when available


/* 
    var io = require('socket.io-client'); 
    */ 
    var io = window.io;


Promise-library needed for old versions of IE, will be removed when Edge has enought market share that we do not need to support IE.
/* var Promise = window.Promise || require('promise'); */

## Initialisation

    window.MuBackend = function MuBackend(url) {
      var self = this;
      var loginFn;
      url = url + (url[url.length -1] === '/' ? "" : "/");
      this._url = url;
      this._socket = (socket = io(url));
      this._listeners = {};
      this.userId = window.localStorage.getItem('mubackend' + url + 'userId');
      this._token = window.localStorage.getItem('mubackend' + url + '_token');
      socket.on('connect', function() { self.emit('connect'); });
      socket.on('disconnect', function() { self.emit('disconnect'); });
      socket.on('message', function(chanId, msg) { self._emit(chanId, msg); });
      if(window.location.hash.indexOf("muBackendLoginToken=") !== -1) {
        loginFn = function() {
          var token = window.location.hash.replace(/.*muBackendLoginToken=/, "");
          socket.emit('loginToken', token, function(result) {
            result = result || {};
            if(result.user && result.token) {
              self._signIn(result.user, result.token);
            } 
          });
          window.setTimeout(function() { self.removeListener('connect', loginFn); }, 0);
        }
        this.on('connect', loginFn);
      }
      self.on('connect', function resubscribe() { self._resubscribe(); });
    };
    MuBackend.prototype._signIn = function(userId,_token) {
      window.localStorage.setItem('mubackend' + this.url + 'userId', (this.userId = userId));
      window.localStorage.setItem('mubackend' + this.url + '_token', (this._token = _token));
      this.emit(userId ? 'signin' : 'signout');
    }
    MuBackend.prototype.signIn = function(userId, password) {
      var self = this;
      this._socket.emit('loginPassword', userId, password, function(err) {
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

    MuBackend.prototype.createDB = function(dbName, isPublic)  {
      var self = this;
      return new Promise(function(resolve, reject) {
      self._socket.emit('createDatabase', 
          self.userId, dbName, !isPublic, self._token, function(err) {
            if(err) { reject(err); } else { resolve(); }});
      });
    };
    MuBackend.prototype.newPouchDB = function(userId, dbName, PouchDB)  {
      self = this;
      return new Promise(function(resolve, reject) {
        self._socket.emit('databaseUrl', userId, dbName, function(url) {
          if(self.userId) {
            url = url.replace('//', '//' +  self.userId + ':' + self._token + '@');
          }
          PouchDB = PouchDB || window.PouchDB;
          resolve(new PouchDB(url));
        });
      });
    };
## Messaging

    MuBackend.prototype._getChan = function(chanId) {
      return this._listeners[chanId] || (this._listeners[chanId] = []);
    }
    MuBackend.prototype._subscribe = function(chanId) {
      this._socket.emit('sub', chanId, this._token);
    }
    MuBackend.prototype._resubscribe = function() {
      var self = this;
      Object.keys(this._listeners).forEach(function(chanId) {
        if(chanId.indexOf(':') !== -1 && self._listeners[chanId].length) {
          self._subscribe(chanId);
        }
      });
    }
    MuBackend.prototype.on = function(chanId, f)  {
      var arr = this._getChan(chanId);
      if(chanId.indexOf(':') !== -1 && !arr.length) {
        this._subscribe(chanId);
      }
      if(arr.indexOf(f) === -1) {
        arr.push(f);
      }
    };
    MuBackend.prototype.removeListener = function(chanId, f)  {
      var arr = this._getChan(chanId);
      var pos = arr.indexOf(f) ;
      if(pos !== -1) {
        arr[pos] = arr[arr.length -1];
        arr.pop();
        if(!arr.length && chanId.indexOf(':') !== -1) {
          this._socket.emit('unsub', chanId);
        }
      }
    };
    MuBackend.prototype._emit = function(chanId, params)  {
      this._getChan(chanId).forEach( function(f) { f.apply(null, params); });
    };
    MuBackend.prototype.emit = function(chanId)  {
      var params = Array.prototype.slice.call(arguments, 1);
      if(chanId.indexOf(':') !== -1) {
        this._socket.emit('pub', chanId, params);
      } else {
        this._emit(chanId, params);
      }
    };
    MuBackend.prototype.emitOnce = function(chanId, message)  {
      var params = Array.prototype.slice.call(arguments, 1);
      this._socket.emit('pubOnce', chanId, params);
    };
## Directory

    MuBackend.prototype.findTagged = function(tag) {
      console.log("TODO: findTagged");
      return new Promise();
    }
    MuBackend.prototype.tagSelf = function(tag, t) {
      console.log("TODO: tagSelf");
    }
# server.js
Routes:

- /auth/$PROVIDER/?RETURN_URL
- /cors/?$URL
- /socket.io/
- /mu.demo.html /mu.intro.js
- /mu.js

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
    var server = require('http').Server(app);
    server.listen(config.port);
## Util

    var crypto = require('crypto');
    var btoa = require('btoa');
    function uniqueId () { return btoa(crypto.randomBytes(12)); }
    function jsonOrEmpty(str) { try { return JSON.parse(str);} catch(_) { return {}; }}
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
    function dbName (user, id) { // ###
      user = user.replace(/_/g, '-');
      var dbName = 'mu_' + user + '_' + encodeURIComponent(id);
      dbName = dbName.toLowerCase();
      dbName = dbName.replace(/[^a-z0-9_$()+-]/g, '$');
      return dbName;
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
        }
        request.put({
          url: couchUrl + name + '/_design/readonly',
          json: {
            validate_doc_update: 'function(_1, _2, user){if(user.name!=="' + 
                                     user + '")throw "Forbidden";}'
          }
        }, function (err, _, body) {
          if (err || body.error) console.log('createDatabaseDesignError:', name, body);
        });
      });
    }
    function validateUser(user, password, callback) { // ###
        request.get(couchUrl + '_users/org.couchdb.user:' + user, function (err, _, body) {
          var body = jsonOrEmpty(body);
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

## socket.io, including message-queue(non-threadable)

    var io = require('socket.io')(server);
### message queue

    var chans = {};
    function getChan(id) { return chans[id] || (chans[id] = []); }
    io.on('connection', function (socket) { // ###
      var subscribedTo = {};
      socket.on('loginToken', function (token, f) { // ####
        f(loginRequests[token]);
        delete loginRequests[token];
      });
      socket.on('loginPassword', validateUser); // ####
      socket.on('dbName', function (user, db, f) { f(dbName(user, db)); }); // ####
      socket.on('createDatabase', function (user, db, isPrivate, password, f) { // ####
        validateUser(user, password, function(err) {
          if(err) { f(err); } else { createDatabase(user, db, isPrivate, f); }
        });
      });
      socket.on('databaseUrl', function(user, db, f) { f(config.couchdb.url + dbName(user, db)); }); // ####
      socket.on('sub', function (chan, password) { // ####
        var splitPos = chan.indexOf(":");
        if(splitPos !== -1) {
        var user = chan.slice(0, splitPos);
          if(user === '*') {
            getChan(chan).push(socket);
          } else {
            validateUser(user, password, function(err) {
              if(!err)  {
                getChan(chan).push(socket);
              }
            });
          }
        }
      });
      socket.on('unsub', unsub); // ####
      function unsub(chan) {
        var chan = getChan(chan);
        var pos = chan.indexOf(socket);
        if(pos !== -1) {
          chan[pos] = chan[chan.length - 1];
          chan.pop();
        }
      }
      socket.on('pub', function (chanId, msg) { // ####
        var chan = getChan(chanId);
        for(var i = 0; i < chan.length; ++i) {
          chan[i].emit('message', chanId, msg);
        }
      });
      socket.on('pubOnce', function (chanId, msg) { // ####
        var chan = getChan(chanId);
        if(chan.length) {
          chan[chan.length * Math.random() | 0].emit('message', chanId, msg);
        }
      });
      socket.on('disconnect', function () { // ####
        for(var chan in subscribedTo) {
          unsubscribe(chan);
        }
      });
      // ####
      setInterval(function() {socket.emit('message', "blah", "foo");}, 10000);
    }); // ####
## CORS

    app.get('/cors/', function (req, res) {
      request.get(req.url.replace(/^[^?]*./, ''), function (_, __, body) {
        res.header('Content-Type', 'text/plain');
        res.end(body);
      });
    });

## Hosting of static resources

    var fs = require('fs');
    app.get('/mu.demo.html', function (req, res) {
      res.end('<html><body>' +
        '<script src=https://cdn.jsdelivr.net/pouchdb/5.1.0/pouchdb.min.js></script>' +
        '<script src=/socket.io/socket.io.js></script>' +
        '<script src=/mu.min.js></script>' +
        '<script src=/mu.intro.js></script>' +
        '</body></html>');
    });
    var muJs = fs.readFileSync('mu.min.js');
    app.get('/mu.min.js', function (req, res) {
      res.end(muJs);
    });
    var introJs = fs.readFileSync('muBackend.js');
    app.get('/mu.intro.js', function (req, res) {
      res.end(introJs);
    });
## create users from configfile
    (function() {
    for(var user in config.createUsers) { createUser(user, config.createUsers[user]); }
    })();
