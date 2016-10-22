# muBackend

[![Build Status](https://travis-ci.org/rasmuserik/mubackend.svg?branch=master)](https://travis-ci.org/rasmuserik/mubackend)
[![Code Climate](https://codeclimate.com/github/rasmuserik/mubackend/badges/gpa.svg)](https://codeclimate.com/github/rasmuserik/mubackend)
[![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg?style=flat-square)](https://github.com/Flet/semistandard)
[![Dependency Status](https://david-dm.org/rasmuserik/mubackend.svg?style=flat-square)](https://david-dm.org/rasmuserik/mubackend)
[![npm](https://img.shields.io/npm/v/mubackend.svg)](https://www.npmjs.com/package/mubackend)
[![npm](https://img.shields.io/npm/l/mubackend.svg)]()


muBackend is a "no-backend",\
responisible for handling\
various social media logins\
and create corresponding users\
in a CouchDB.

It is deployed\
via Docker Hub.

Configured via\
the following\
environment vars:

- `GITHUB_ID` `GITHUB_SECRET` oauth from https://github.com/settings/applications
- `COUCHDB_URL` `COUCHDB_USER` `COUCHDB_PASS` couch credentials
- `CLIENT_REGEXP` allowed client domains
- `SESSION_SECRET` unique / unguessable string for sessions
- `PORT` port to run the server on
