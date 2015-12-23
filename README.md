# muBackend
//
## Introduction
### The name
//
mu is the SI-prefix for micro, ie. a micro-backend, or no-backend.
//
A developer was laying in a hammock, pondering about backends. 
Then a cow came by and said "MU", and suddenly the develper was enlightened.
//
### Nanos gigantum humeris insidentes
//
*If I have seen further, it is by standing on the shoulders of giants.* - Isaac Newton
//
muBackend is just the empty space between the following technologies:
//
- Passport for authentication
- CouchDB for syncing PouchDB, at hosting data
- Socket.io and Socket.io-p2p for communication between clients
//
### Files
//
- README.md - README: a concatenation of intro.js, mu.js, and backend.js as literate code.
- `intro.js` sample usage
- `mu.js` the client side library
- `backend.js the server side code
- `dev.sh` shell script used during development
//
# intro.js (literate code)
//
    f(!location.hash) {
     location.href = "https://api.solsort.com/auth/github?" + location.href;

    
# Client (mu.js)
//
    function(window) {
    )(window);
## Server (backend.js)
//
    ar express = require('express');
    ar session = require('express-session');
    ar crypto = require('crypto');
    ar fs = require('fs');
    ar passport = require("passport");
    ar config = require("/solsort/config.json");
    ar btoa = require("btoa");
    ar request = require("request");

    ar app = express();
    pp.use(session(config.expressSession));
    ar server = require('http').Server(app);

    erver.listen(4078);

## Util
//

    unction uniqueId() { return btoa(crypto.randomBytes(12)); }

## CouchDB
//
    ar couchUrl = "http://" + config.couchdb.user + ":" + 
    onfig.couchdb.password + "@localhost:5984/";
    unction getUser(user, callback) {
     request.get(couchUrl + '_users/org.couchdb.user:' + user, 
         function(err, response, body) {
           callback(err?{error:"request error"}:JSON.parse(body));
         });
    
    unction createUser(user, fullname, password) {
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
    
    unction dbName(user, id, isPrivate) { // ###
     user = user.replace(/_/g, "-");
     var dbName = "mu_" + user + (isPrivate?"_600_":"_644_") + encodeURIComponent(id);
     dbName = dbName.toLowerCase();
     dbName = dbName.replace(/[^a-z_$()+-]/g, "$");
     return dbName; 
    
    unction createDatabase(user, id, isPrivate, callback) { // ###
     var name = dbName(user, id, isPrivate);
     request.put({
       url: couchUrl + name,
       json: {}
     }, function(err, _, body) {
       callback(err || body.error);
       if(isPrivate) {
         request.put({
           url: couchUrl + name + "/_security",
           json: {"admins": { "names": [], "roles": [] },
             "members": { "names": [ user ], "roles": []}}
         }, function(err, _, body) {
           if(err || body.error) console.log("createDatabaseSecurityError:", name, body);
         });
       } 
       request.put({
         url: couchUrl + name + "/_design/readonly",
         json: {
           validate_doc_update:
             'function(_1, _2, user){if(user.name!=="' + name + '")throw "Forbidden";}'
         }
       }, function(err, _, body) {
         if(err || body.error) console.log("createDatabaseDesignError:", name, body);
       });
     });
    

## Login
//
    ar loginRequests = {};

    unction loginHandler(provider) {
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
             pw = uniqueId();
             createUser(user,profile.displayName || profile.name, pw);
           }

           var token = uniqueId();
           var app = req.session.app;
           loginRequests[token] = {user: user, password: pw, time: Date.now()};
           if(app.indexOf("#") === -1) {
             app += "#"
           }
           res.redirect(app + "solsortLoginToken=" + token);
         });
       });
     };
    

    unction login(access, refresh, profile, done) { return done(profile); }
    unction addStrategy(name, Strategy, opt) {
     passport.use(new Strategy(config[name], login));
     app.get('/auth/' + name, 
         function(req, res) {
           req.session.app = req.url.replace(/^[^?]*./, "");
           return passport.authenticate(name, opt)(req, res);
         });
     app.get('/auth/' + name + '/callback', loginHandler(name));
    


    ddStrategy('github', require("passport-github"));
    ddStrategy('twitter', require("passport-twitter"));
    ddStrategy('linkedin', require("passport-linkedin"));
    ddStrategy('google', require("passport-google-oauth").OAuth2Strategy, {scope: 'profile'});
    ddStrategy('facebook', require("passport-facebook"));
    ddStrategy('wordpress', require("passport-wordpress").Strategy, {scope: 'auth'});

## socket.io, including message-queue(non-threadable)
//

    ar io = require('socket.io')(server);
    ar p2pserver = require('socket.io-p2p-server').Server;
    o.use(p2pserver);

### message queue
//
    ar connectionSubs= {};
    ar subscribers = {};
    ar messages = {};
    unction getList(o, name) {
     var result = o[name];
     if(!result) {
       result = [];
       o[name] = result;
     }
     return result;
    
    unction unsubscribe(socket, user) {
     var subs = getList(subscribers, user);
     var pos = subs.indexOf(socket) ;
     if(pos !== -1) {
       subs[pos] = subs[subs.length - 1];
       subs.pop();
     }
    

    o.on("connection", function(socket) { // ###
     socket.on("login", function(token, f) { // ####
       f(loginRequests[token]);
       delete loginRequests[token];
     });
     socket.on("dbName", function(user, db, isPrivate, f) { // ####
       f(dbName(user,db,isPrivate));
     });
     socket.on("createDatabase", function(user, db, isPrivate, password, f) { // ####
       request.get(couchUrl + "_users/org.couchdb.user:" + user, function(err, _, body) {
         if(password === body.password) {
           createDatabase(user, db, isPrivate,f);
         } else {
           f("Login error");
         }
       });
     });
     socket.on("subscribe", function(user, password) { // ####
       request.get(couchUrl + "_users/org.couchdb.user:" + user, function(err, _, body) {
         if(password === body.password) {
           getList(connectionSubs, socket.id).push(user);
           getList(subscribers, user).push(socket);
           var msgs = getList(messages, user);
           while(msgs.length) {
             socket.emit("message", user, msgs.pop());
           }
         }
       });
     });
     socket.on("unsubscribe", function(user) { // ####
       unsubscribe(socket, user);
     });
     socket.on("message", function(user, msg) { // ####
       var listeners = getList(subscriber, user);
       if(listeners.length) {
         listeners[listeners.length*Math.random() |0].emit("message", msg);
       } else {
         getList(messages, user).push(msg);
       }
     });
     socket.on("disconnect", function() { // ####
       var subs = getList(connectionSubs, socket.id);
       while(subs.length) {
         unsubscribe(socket, subs.pop());
       }
       delete connectionSubs[socket.id];
     });
    ); // ####
## CORS
//
    pp.get('/cors/', function(req, res) {
     request.get(req.url.replace(/^[^?]*./, ""), function(err, response, body) {
       res.header("Content-Type", "text/plain");
       res.end(body);
     });
    );

## Hosting of static resources
//
    pp.get('/', function(req,res) {
     res.end("<html><body>" +
         "<script src=/mu.js></script>" +
         "<script src=/intro.js></script>" +
         "</body></html>");
    );
    ar muJs = fs.readFileSync("mu.js");
    pp.get('/mu.js', function(req,res) {
     res.end(muJs);
    );
    ar introJs =fs.readFileSync("intro.js") 
    pp.get('/intro.js', function(req,res) {
     res.end(introJs);
    );
