# mubackend

This is a backend server that is not there. 

It has the following features:

- Starts a socket.io peer2peer server.
- Checks every connected peer if it is a daemon (user in a connected CouchDB).
- Runs a HTTP-server, and forwards GET-requests to to load-balanced daemon peers. 
  - Several requests at the same time for an url, only yield one request to the daemon.
- Send logging to load-balanced daemon peers.
