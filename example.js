// # muBackend
//
// [![Build Status](https://travis-ci.org/rasmuserik/mubackend.svg?branch=master)](https://travis-ci.org/rasmuserik/mubackend)
// [![Code Climate](https://codeclimate.com/github/rasmuserik/mubackend/badges/gpa.svg)](https://codeclimate.com/github/rasmuserik/mubackend)
// [![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg?style=flat-square)](https://github.com/Flet/semistandard)
// [![Dependency Status](https://david-dm.org/rasmuserik/mubackend.svg?style=flat-square)](https://david-dm.org/rasmuserik/mubackend)
// [![npm](https://img.shields.io/npm/v/mubackend.svg)](https://www.npmjs.com/package/mubackend)
// [![npm](https://img.shields.io/npm/l/mubackend.svg)]()
//
// Literate programming: This documentation _is_ and contains the entire source code.
//
// # Under development, not done yet!
//
// MuBackend is a noBackend backend, <br>
// primarily for single page applications. <br> 
// Intended features:
//
// - *Authentication* of users through different providers
// - *Synchronization*  of user data across different clients/devices
// - *Communication* sending messages between users
//
// The design criterias are: *simplicity* and *scaleability*. <br>
// This README.md, contains the *entire* source code, <br>
// both for the client and the server. <br>
// This implementation prioritises simplicity<br>
// over scaleability, but all of the API/algorithms<br>
// can be implemented with web-scale performance.
// 
// # API 
//
// API is under implementation
//
// ## Initialisation
//
// - `mu = new MuBackend(url)`
// - `mu.userId` - a string that identifies the user, if currently logged in
// - `mu.signIn(userId, password)` - login with username/password
// - `mu.signInWith(provider)` - login with a given provider, providers can be: "github", "twitter", "linkedin", "google", "facebook", or "wordpress". Typically called when the user clicks on a log-in button. *The user leaves the page and will be redirected home to `location.href` when done*
// - `mu.signOut()`
//
// ## Storage
//
// MuBackend allows creation of sync-endpoints for PouchDB. 
//
// - `mu.createDB(dbName, public)` - allocates a new online database, owned by the current user. If `public` is true, then it will be readable by anyone. Otherwise it will only be readable by the current user.
// - `mu.newPouchDB(userId, dbName, PouchDB)` - returns a new PouchDB online database connected to a named db belonging to a given user. It will be read-only, unless userID is the current user. `PouchDB` is the PouchDB constructor. This is often just used for replication to/from a locally cached PouchDB.
//
// ## Messaging 
//
// - `mu.send(user, inbox, message)` - put an object to an inbox owned by a given user
// - `mu.inbox(inbox)` - get a pouchdb representing an inbox
//
// # Roadmap
//
// ## Changelog
//
// - 0.1.0 Initial working version, supports login, database creation+access, and inter-user messaging, very unpolished.
//
// ## Backlog
//
// - 0.2
//   - √common.js with db-url - no promise on create
//   - √remove messaging, REST instead of socket.io, (for mobile battery performance)
//   - √send/inbox api
//   - √icon
//   - demo site
//   - automated test
//   - better documentation
// - later
//   - Guide to install/self-host
//   - Docker
//   - Announce
//   - video tutorial
//   - example page for experimentation
//   - `mu.findTagged(tag)` -> list of user-ids with given tag
//   - `mu.tagSelf(tag, true/false)` -> register/deregister current user as having a tag
//    - Sample applications
// 
//
// ## Versions
//
// Even minor versions are releases, odd minor versions are development. Semi-semver
//
// <!--
// # Naming etc.
// ## The name
//
// mu is the SI-prefix for micro, ie. a micro-backend, or no-backend.
//
// A developer was laying in a hammock, pondering about backends.
// Then a cow came by and said "MU", and suddenly the develper was enlightened.
//
// ## Nanos gigantum humeris insidentes
//
// *If I have seen further, it is by standing on the shoulders of giants.* - Isaac Newton
//
// muBackend is just the empty space between the following technologies:
//
// - Passport for authentication
// - CouchDB for syncing PouchDB, at hosting data
// - Socket.io and Socket.io-p2p for communication between clients
//
// ## Files
//
// - README.md - README: a concatenation of the source file as literate code.
// - `muBackend.js` project documentation, sample usage
// - `client.js` the client side library
// - `server.js the server side code
// - `dev.sh` shell script used during development, which autoruns/restarts the server and generates README.md
// - `config.sample.json` sample config file, the filename should be added as an argument when running `dev.sh` or `server.js`
//
// -->
//
// # Installation
//
// Dev-dependency on ubuntu linux: `apt-get install inotify-tools couchdb npm`
//
// # example.js
//
window.mu = new window.MuBackend('https://api.solsort.com/');
// # index.html
//
// The html code, used for the example above, is:
