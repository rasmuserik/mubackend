<!-- MACHINE GENERATED - DO NOT EDIT - USE `./dev.sh` -->
# muBackend

[![Build Status](https://travis-ci.org/rasmuserik/mubackend.svg?branch=master)](https://travis-ci.org/rasmuserik/mubackend)
[![Code Climate](https://codeclimate.com/github/rasmuserik/mubackend/badges/gpa.svg)](https://codeclimate.com/github/rasmuserik/mubackend)
[![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg?style=flat-square)](https://github.com/Flet/semistandard)
[![Dependency Status](https://david-dm.org/rasmuserik/mubackend.svg?style=flat-square)](https://david-dm.org/rasmuserik/mubackend)
[![npm](https://img.shields.io/npm/v/mubackend.svg)](https://www.npmjs.com/package/mubackend)
[![npm](https://img.shields.io/npm/l/mubackend.svg)]()

In-progress, - not done yet...

Design goals:

- *noBackend* - make client-side apps communcate and synchronise, without app-specific backend, this includes: 1) persist/sync'ed storage 2) communication between peers, 3) peer discovery
- *decentralisable* - start out with traditional client-server architecture, but keep in mind how it could be completely decentralised/p2p later on.
- *simplicity* - should be as simple/small as possible

## API

API is under design, and not implemented yet:  

### Initialisation

- `mu = new MuBackend(url)`
- `mu.userId` - a string that identifies the user, if currently logged in
- `mu.userFullName` - the full name of the user, if available
- `mu.login(provider)` - login with a given provider, providers can be: "github", "twitter", "linkedin", "google", "facebook", or "wordpress". Typically called when the user clicks on a log-in button. *The user leaves the page and will be redirected home to `location.href` when done*
- `mu.logout()`

#### Storage

MuBackend allows creation of sync-endpoints for PouchDB. 

- `mu.createDB(dbName, public)` - allocates a new online database, owned by the current user. If `public` is true, then it will be readable by anyone. Otherwise it will only be readable by the current user.
- `mu.newPouchDB(userId, dbName, PouchDB)` - returns a new PouchDB online database connected to a named db belonging to a given user. It will be read-only, unless userID is the current user. `PouchDB` is the PouchDB constructor. This is often just used for replication to/from a locally cached PouchDB.

#### Messaging

Communications between peers happens through channels. The channel id consists of an owner and a name, separated by ":". Anybody can write to a channel, but only the owner can listen. There is a special owner "*", which also allows everybody to listen. The API is inspired by socket.io/node.js.

- `mu.on(mu.userId + ":someChannel", f)` or `mu.on("*:someChannel", f)` - listen to events
- `mu.on('connect', f)` and `mu.on('disconnect', f)` - get notified on connect/disconnect
- `mu.removeListener(id, f)` stop listening
- `mu.emit(message-chan, message)` - emit to all listeners if connected
- `mu.emitOnce(message-chan, message)` - emit to one random listener if connected

#### Directory

A user can add tags to itself, which makes him/her discoverable for other users.

- `mu.findTagged(tag)` -> promise of list of user-ids with given tag
- `mu.tagSelf(tag, true/false)` -> register/deregister current user as having a tag

## Introduction
### The name

mu is the SI-prefix for micro, ie. a micro-backend, or no-backend.

A developer was laying in a hammock, pondering about backends.
Then a cow came by and said "MU", and suddenly the develper was enlightened.

### Nanos gigantum humeris insidentes

*If I have seen further, it is by standing on the shoulders of giants.* - Isaac Newton

muBackend is just the empty space between the following technologies:

- Passport for authentication
- CouchDB for syncing PouchDB, at hosting data
- Socket.io and Socket.io-p2p for communication between clients

### Files

- README.md - README: a concatenation of intro.js, mu.js, and backend.js as literate code.
- `intro.js` sample usage
- `mu.js` the client side library
- `backend.js the server side code
- `dev.sh` shell script used during development, which autoruns/restarts the server and generates README.md
- `config.sample.json` sample config file, the filename should be added as an argument when running `dev.sh` or `backend.js`

## Dev-dependencies

On ubuntu linux: `apt-get install inotify-tools couchdb npm`

# intro.js (literate code)

    if (!window.location.hash) {
      window.location.href = 'https://api.solsort.com/auth/github?' + window.location.href
    }
# Client (mu.js)

## Server (backend.js)

Routes:

- /auth/$PROVIDER/?RETURN_URL
- /cors/?$URL
- /socket.io/
- /mu-demo.html /intro.js
- /mu.js

## Load dependencies


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
## CouchDB

    var request = require('request');
    var couchUrl = config.couchdb.url.replace('//', '//' +
      config.couchdb.user + ':' + config.couchdb.password);
    function getUser (user, callback) {
      request.get(couchUrl + '_users/org.couchdb.user:' + user,
        function (err, response, body) {
          callback(err ? {error: 'request error'} : JSON.parse(body));
        });
    }
    function createUser (user, fullname, password) {
      request.put({
        url: couchUrl + '_users/org.couchdb.user:' + user,
        json: {
          name: user,
          fullname: fullname,
          password: password,
          plain_pw: password,
          roles: [],
          type: 'user'
        }
      }, function (_, __, body) {
        console.log('createUser:', user, body);
      });
    }
    function dbName (user, id, isPrivate) { // ###
      user = user.replace(/_/g, '-');
      var dbName = 'mu_' + user + (isPrivate ? '_600_' : '_644_') + encodeURIComponent(id);
      dbName = dbName.toLowerCase();
      dbName = dbName.replace(/[^a-z_$()+-]/g, '$');
      return dbName;
    }
    function createDatabase (user, id, isPrivate, callback) { // ###
      var name = dbName(user, id, isPrivate);
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
                                     name + '")throw "Forbidden";}'
          }
        }, function (err, _, body) {
          if (err || body.error) console.log('createDatabaseDesignError:', name, body);
        });
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
          console.log('LOGIN', user, JSON.stringify(profile._raw));

          if (!profile.id) {
            return res.redirect(app);
          }
          getUser(user, function (o) {
            var pw;
            if (!o.error) {
              pw = o.plain_pw;
            } else {
              pw = uniqueId();
              createUser(user, profile.displayName || profile.name, pw);
            }

            var token = uniqueId();
            var app = req.session.app;
            loginRequests[token] = {user: user, password: pw, time: Date.now()};
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
    var p2pserver = require('socket.io-p2p-server').Server;
    io.use(p2pserver);

### message queue

    var connectionSubs = {};
    var subscribers = {};
    var messages = {};
    function getList (o, name) {
      var result = o[name];
      if (!result) {
        result = [];
        o[name] = result;
      }
      return result;
    }
    function unsubscribe (socket, user) {
      var subs = getList(subscribers, user);
      var pos = subs.indexOf(socket);
      if (pos !== -1) {
        subs[pos] = subs[subs.length - 1];
        subs.pop();
      }
    }

    io.on('connection', function (socket) { // ###
      socket.on('login', function (token, f) { // ####
        f(loginRequests[token]);
        delete loginRequests[token];
      });
      socket.on('dbName', function (user, db, isPrivate, f) { // ####
        f(dbName(user, db, isPrivate));
      });
      socket.on('createDatabase', function (user, db, isPrivate, password, f) { // ####
        request.get(couchUrl + '_users/org.couchdb.user:' + user, function (err, _, body) {
          if (err || password !== body.password) {
            f('Login error');
          } else {
            createDatabase(user, db, isPrivate, f);
          }
        });
      });
      socket.on('subscribe', function (user, password) { // ####
        request.get(couchUrl + '_users/org.couchdb.user:' + user, function (err, _, body) {
          if (!err && password === body.password) {
            getList(connectionSubs, socket.id).push(user);
            getList(subscribers, user).push(socket);
            var msgs = getList(messages, user);
            while (msgs.length) {
              socket.emit('message', user, msgs.pop());
            }
          }
        });
      });
      socket.on('unsubscribe', function (user) { // ####
        unsubscribe(socket, user);
      });
      socket.on('message', function (user, msg) { // ####
        var listeners = getList(subscribers, user);
        if (listeners.length) {
          listeners[listeners.length * Math.random() | 0].emit('message', msg);
        } else {
          getList(messages, user).push(msg);
        }
      });
      socket.on('disconnect', function () { // ####
        var subs = getList(connectionSubs, socket.id);
        while (subs.length) {
          unsubscribe(socket, subs.pop());
        }
        delete connectionSubs[socket.id];
      });
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
    app.get('/mu-demo.html', function (req, res) {
      res.end('<html><body>' +
        '<script src=/mu.js></script>' +
        '<script src=/intro.js></script>' +
        '</body></html>');
    });
    var muJs = fs.readFileSync('mu.js');
    app.get('/mu.js', function (req, res) {
      res.end(muJs);
    });
    var introJs = fs.readFileSync('intro.js');
    app.get('/intro.js', function (req, res) {
      res.end(introJs);
    });
