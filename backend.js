// ## Server (backend.js)
//
// Routes:
//
// - /auth/$PROVIDER/?RETURN_URL
// - /cors/?$URL
// - /socket.io/
// - /mu-demo.html /intro.js
// - /mu.js
//
var express = require('express')
var session = require('express-session')
var crypto = require('crypto')
var fs = require('fs')
var passport = require('passport')
var btoa = require('btoa')
var request = require('request')

// ## Load config
//
var configFile = process.argv[process.argv.length - 1]
if (configFile.slice(-5) !== '.json') {
  console.log('Error: backend needs .json config file as argument.')
  process.exit(-1)
}
var config = require(configFile)
console.log(config)

// ### Default configuration
//
config.port = config.port || 4078

// ## start express server
var app = express()
app.use(session(config.expressSession))
var server = require('http').Server(app)

server.listen(config.port)

// ## Util
//

function uniqueId () { return btoa(crypto.randomBytes(12)) }

// ## CouchDB
//
var couchUrl = config.couchdb.url.replace('//', '//' +
  config.couchdb.user + ':' + config.couchdb.password)

function getUser (user, callback) {
  request.get(couchUrl + '_users/org.couchdb.user:' + user,
    function (err, response, body) {
      callback(err ? {error: 'request error'} : JSON.parse(body))
    })
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
    console.log('createUser:', user, body)
  })
}
function dbName (user, id, isPrivate) { // ###
  user = user.replace(/_/g, '-')
  var dbName = 'mu_' + user + (isPrivate ? '_600_' : '_644_') + encodeURIComponent(id)
  dbName = dbName.toLowerCase()
  dbName = dbName.replace(/[^a-z_$()+-]/g, '$')
  return dbName
}
function createDatabase (user, id, isPrivate, callback) { // ###
  var name = dbName(user, id, isPrivate)
  request.put({
    url: couchUrl + name,
    json: {}
  }, function (err, _, body) {
    callback(err || body.error)
    if (isPrivate) {
      request.put({
        url: couchUrl + name + '/_security',
        json: {'admins': { 'names': [], 'roles': [] },
        'members': {'names': [user], 'roles': []}}
      }, function (err, _, body) {
        if (err || body.error) console.log('createDatabaseSecurityError:', name, body)
      })
    }
    request.put({
      url: couchUrl + name + '/_design/readonly',
      json: {
        validate_doc_update: 'function(_1, _2, user){if(user.name!=="' + name + '")throw "Forbidden";}'
      }
    }, function (err, _, body) {
      if (err || body.error) console.log('createDatabaseDesignError:', name, body)
    })
  })
}

// ## Login
//
var loginRequests = {}

function loginHandler (provider) {
  return function (req, res) {
    passport.authenticate(provider)(req, res, function (profile) {
      if (profile.provider === 'Wordpress') profile.id = profile._json.ID
      var user = encodeURIComponent(profile.provider + '_' + profile.id)
      console.log('LOGIN', user, JSON.stringify(profile._raw))

      if (!profile.id) {
        return res.redirect(app)
      }
      getUser(user, function (o) {
        var pw
        if (!o.error) {
          pw = o.plain_pw
        } else {
          pw = uniqueId()
          createUser(user, profile.displayName || profile.name, pw)
        }

        var token = uniqueId()
        var app = req.session.app
        loginRequests[token] = {user: user, password: pw, time: Date.now()}
        if (app.indexOf('#') === -1) {
          app += '#'
        }
        res.redirect(app + 'solsortLoginToken=' + token)
      })
    })
  }
}

function login (access, refresh, profile, done) { return done(profile) }
function addStrategy (name, Strategy, opt) {
  passport.use(new Strategy(config[name], login))
  app.get('/auth/' + name,
    function (req, res) {
      req.session.app = req.url.replace(/^[^?]*./, '')
      return passport.authenticate(name, opt)(req, res)
    })
  app.get('/auth/' + name + '/callback', loginHandler(name))
}

addStrategy('github', require('passport-github'))
addStrategy('twitter', require('passport-twitter'))
addStrategy('linkedin', require('passport-linkedin'))
addStrategy('google', require('passport-google-oauth').OAuth2Strategy, {scope: 'profile'})
addStrategy('facebook', require('passport-facebook'))
addStrategy('wordpress', require('passport-wordpress').Strategy, {scope: 'auth'})

// ## socket.io, including message-queue(non-threadable)
//

var io = require('socket.io')(server)
var p2pserver = require('socket.io-p2p-server').Server
io.use(p2pserver)

// ### message queue
//
var connectionSubs = {}
var subscribers = {}
var messages = {}
function getList (o, name) {
  var result = o[name]
  if (!result) {
    result = []
    o[name] = result
  }
  return result
}
function unsubscribe (socket, user) {
  var subs = getList(subscribers, user)
  var pos = subs.indexOf(socket)
  if (pos !== -1) {
    subs[pos] = subs[subs.length - 1]
    subs.pop()
  }
}

io.on('connection', function (socket) { // ###
  socket.on('login', function (token, f) { // ####
    f(loginRequests[token])
    delete loginRequests[token]
  })
  socket.on('dbName', function (user, db, isPrivate, f) { // ####
    f(dbName(user, db, isPrivate))
  })
  socket.on('createDatabase', function (user, db, isPrivate, password, f) { // ####
    request.get(couchUrl + '_users/org.couchdb.user:' + user, function (err, _, body) {
      if (err || password !== body.password) {
        f('Login error')
      } else {
        createDatabase(user, db, isPrivate, f)
      }
    })
  })
  socket.on('subscribe', function (user, password) { // ####
    request.get(couchUrl + '_users/org.couchdb.user:' + user, function (err, _, body) {
      if (!err && password === body.password) {
        getList(connectionSubs, socket.id).push(user)
        getList(subscribers, user).push(socket)
        var msgs = getList(messages, user)
        while (msgs.length) {
          socket.emit('message', user, msgs.pop())
        }
      }
    })
  })
  socket.on('unsubscribe', function (user) { // ####
    unsubscribe(socket, user)
  })
  socket.on('message', function (user, msg) { // ####
    var listeners = getList(subscribers, user)
    if (listeners.length) {
      listeners[listeners.length * Math.random() | 0].emit('message', msg)
    } else {
      getList(messages, user).push(msg)
    }
  })
  socket.on('disconnect', function () { // ####
    var subs = getList(connectionSubs, socket.id)
    while (subs.length) {
      unsubscribe(socket, subs.pop())
    }
    delete connectionSubs[socket.id]
  })
}) // ####
// ## CORS
//
app.get('/cors/', function (req, res) {
  request.get(req.url.replace(/^[^?]*./, ''), function (_, __, body) {
    res.header('Content-Type', 'text/plain')
    res.end(body)
  })
})

// ## Hosting of static resources
//
app.get('/mu-demo.html', function (req, res) {
  res.end('<html><body>' +
    '<script src=/mu.js></script>' +
    '<script src=/intro.js></script>' +
    '</body></html>')
})
var muJs = fs.readFileSync('mu.js')
app.get('/mu.js', function (req, res) {
  res.end(muJs)
})
var introJs = fs.readFileSync('intro.js')
app.get('/intro.js', function (req, res) {
  res.end(introJs)
})
