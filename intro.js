// # muBackend
//
// [![Build Status](https://travis-ci.org/rasmuserik/mubackend.svg?branch=master)](https://travis-ci.org/rasmuserik/mubackend)
// [![Code Climate](https://codeclimate.com/github/rasmuserik/mubackend/badges/gpa.svg)](https://codeclimate.com/github/rasmuserik/mubackend)
// [![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg?style=flat-square)](https://github.com/Flet/semistandard)
// [![Dependency Status](https://david-dm.org/rasmuserik/mubackend.svg?style=flat-square)](https://david-dm.org/rasmuserik/mubackend)
// [![npm](https://img.shields.io/npm/v/mubackend.svg)](https://www.npmjs.com/package/mubackend)
// [![npm](https://img.shields.io/npm/l/mubackend.svg)]()
//
// In-progress, - not done yet...
//
// Design goals:
//
// - *noBackend* - make client-side apps communcate and synchronise, without app-specific backend, this includes: 1) persist/sync'ed storage 2) communication between peers, 3) peer discovery
// - *decentralisable* - start out with traditional client-server architecture, but keep in mind how it could be completely decentralised/p2p later on.
// - *simplicity* - should be as simple/small as possible
//
// ## API
//
// API is under design, and not implemented yet:  
//
// ### Initialisation
//
// - `mu = new MuBackend(url)`
// - `mu.userId` - a string that identifies the user, if currently logged in
// - `mu.userFullName` - the full name of the user, if available
// - `mu.login(provider)` - login with a given provider, providers can be: "github", "twitter", "linkedin", "google", "facebook", or "wordpress". Typically called when the user clicks on a log-in button. *The user leaves the page and will be redirected home to `location.href` when done*
// - `mu.logout()`
//
// #### Storage
//
// MuBackend allows creation of sync-endpoints for PouchDB. 
//
// - `mu.createDB(dbName, public)` - allocates a new online database, owned by the current user. If `public` is true, then it will be readable by anyone. Otherwise it will only be readable by the current user.
// - `mu.newPouchDB(userId, dbName, PouchDB)` - returns a new PouchDB online database connected to a named db belonging to a given user. It will be read-only, unless userID is the current user. `PouchDB` is the PouchDB constructor. This is often just used for replication to/from a locally cached PouchDB.
//
// #### Messaging
//
// Communications between peers happens through channels. The channel id consists of an owner and a name, separated by ":". Anybody can write to a channel, but only the owner can listen. There is a special owner "*", which also allows everybody to listen. The API is inspired by socket.io/node.js.
//
// - `mu.on(mu.userId + ":someChannel", f)` or `mu.on("*:someChannel", f)` - listen to events
// - `mu.on('connect', f)` and `mu.on('disconnect', f)` - get notified on connect/disconnect
// - `mu.removeListener(id, f)` stop listening
// - `mu.emit(message-chan, message)` - emit to all listeners if connected
// - `mu.emitOnce(message-chan, message)` - emit to one random listener if connected
//
// #### Directory
//
// A user can add tags to itself, which makes him/her discoverable for other users.
//
// - `mu.findTagged(tag)` -> promise of list of user-ids with given tag
// - `mu.tagSelf(tag, true/false)` -> register/deregister current user as having a tag
//
// ## Introduction
// ### The name
//
// mu is the SI-prefix for micro, ie. a micro-backend, or no-backend.
//
// A developer was laying in a hammock, pondering about backends.
// Then a cow came by and said "MU", and suddenly the develper was enlightened.
//
// ### Nanos gigantum humeris insidentes
//
// *If I have seen further, it is by standing on the shoulders of giants.* - Isaac Newton
//
// muBackend is just the empty space between the following technologies:
//
// - Passport for authentication
// - CouchDB for syncing PouchDB, at hosting data
// - Socket.io and Socket.io-p2p for communication between clients
//
// ### Files
//
// - README.md - README: a concatenation of intro.js, mu.js, and backend.js as literate code.
// - `intro.js` sample usage
// - `mu.js` the client side library
// - `backend.js the server side code
// - `dev.sh` shell script used during development, which autoruns/restarts the server and generates README.md
// - `config.sample.json` sample config file, the filename should be added as an argument when running `dev.sh` or `backend.js`
//
// ## Dev-dependencies
//
// On ubuntu linux: `apt-get install inotify-tools couchdb npm`
//
// # intro.js (literate code)
//
if (!window.location.hash) {
  window.location.href = 'https://api.solsort.com/auth/github?' + window.location.href
}
