// Routes:
//
// - /auth/$PROVIDER/?RETURN_URL
// - /cors/?$URL
// - /socket.io/
// - /mu.demo.html /mu.intro.js
// - /mu.js
// 
// ## Load config
//
var configFile = process.argv[process.argv.length - 1];
if (configFile.slice(-5) !== '.json') {
  console.log('Error: backend needs .json config file as argument.');
  process.exit(-1);
}
var config = require(configFile);
// ### Default configuration
//
config.port = config.port || 4078;

// ## start express server
var app = require('express')();
app.use(require('express-session')(config.expressSession));
var server = require('http').Server(app);
server.listen(config.port);
// ## Util
//
var crypto = require('crypto');
var btoa = require('btoa');
function uniqueId () { return btoa(crypto.randomBytes(12)); }
function jsonOrEmpty(str) { try { return JSON.parse(str);} catch(_) { return {}; }}
// ## CouchDB
//
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
// ## Login
//
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

// ## socket.io, including message-queue(non-threadable)
//
var io = require('socket.io')(server);
// ### message queue
//
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
// ## CORS
//
app.get('/cors/', function (req, res) {
  request.get(req.url.replace(/^[^?]*./, ''), function (_, __, body) {
    res.header('Content-Type', 'text/plain');
    res.end(body);
  });
});

// ## Hosting of static resources
//
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
// ## create users from configfile
(function() {
for(var user in config.createUsers) { createUser(user, config.createUsers[user]); }
})();
