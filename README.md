# mubackend

This is minimal generic backend. 

Not fully implemented yet.

Intended features:

- Authentication: login via oauth(github,twitter,wordpress,etc.)
- Create databases (one public, and one private CouchDB per authenticated user)
- Communication between users
  - send message to logged-in user by username, only authenticated users can receive
  - socket.io-p2p

