// # Client (mu.js)
//
// We load socket.io as a static dependency, such that we can load it when offline, and it will go online when available
//

/* 
var io = require('socket.io-client'); 
*/ 
var io = window.io;

//
// Promise-library needed for old versions of IE, will be removed when Edge has enought market share that we do not need to support IE.
/* var Promise = window.Promise || require('promise'); */
// ## Initialisation
//
window.MuBackend = function MuBackend(url) {
  var self = this;
  var loginFn;
  url = url + (url[url.length -1] === '/' ? "" : "/");
  self._url = url;
  self._socket = io(url);
  self._listeners = {};
  self._socket.on('connect', function() { self.emit('connect'); });
  self._socket.on('disconnect', function() { self.emit('disconnect'); });
  self.userId = window.localStorage.getItem('mubackend' + url + 'userId');
  self.userFullName = window.localStorage.getItem('mubackend' + url + 'userFullName');
  self._password = window.localStorage.getItem('mubackend' + url + '_password');
  if(window.location.hash.indexOf("muBackendLoginToken=") !== -1) {
    loginFn = function loginFn() {
      console.log("TODO: loginFn");
      window.setTimeout(function() { self.removeListener('connect', loginFn); }, 0);
    }
    self.on('connect', loginFn);
  }
  self.on('connect', function resubscribe() { self._resubscribe(); });
};
MuBackend.prototype.signInWith = function(provider) {
  window.location.href = this._url + 'auth/' + provider + '?' + window.location.href;
};
MuBackend.prototype.signOut = function () {
  this.userId = this.userFullName = this._password = undefined;
  window.localStorage.setItem('mubackend' + this.url + 'userId', undefined);
  window.localStorage.setItem('mubackend' + this.url + 'userFullName', undefined);
  window.localStorage.setItem('mubackend' + this.url + '_password', undefined);
};
// ## Storage
//
MuBackend.prototype.createDB = function(dbName, public)  {
  var p = new Promise();
  console.log("TODO: createDB");
  return p;
};
MuBackend.prototype.newPouchDB = function(userId, dbName, PouchDB)  {
  var p = new Promise();
  console.log("TODO: newPouchDB");
  return p;
};
// ## Messaging
//
MuBackend.prototype._getChan = function(chanId) {
  return this._listeners[chanId] || (this._listeners[chanId] = []);
}
MuBackend.prototype._subscribe = function(chanId) {
  console.log("TODO: subscribe ", chanId);
}
MuBackend.prototype._resubscribe = function() {
  Object.keys(this._listeners).forEach(function(chanId) {
    if(chanId.indexOf(':') !== -1 && this._listeners[chanId].length) {
      this._subscribe(chanId);
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
      console.log("TODO: socket-subscribe chan");
    }
  }
};
MuBackend.prototype.emit = function(chanId, message)  {
  if(chanId.indexOf(':') !== -1) {
    console.log("TODO: socket emit");
  }
  var self = this;
  this._getChan(chanId).forEach( function(f) { f(message); });
};
MuBackend.prototype.emitOnce = function(chanId, message)  {
  var arr = this._getChan(chanId);
  if(arr.length) {
    arr[Math.random() * arr.length | 0](message);
  } else if(chanId.indexOf(':') !== -1) {
    console.log("TODO: socket emitOnce");
  }
};
// ## Directory
// 
MuBackend.prototype.findTagged = function(tag) {
  var p = new Promise();
  console.log("TODO: findTagged");
  return p;
}
MuBackend.prototype.tagSelf = function(tag, t) {
  console.log("TODO: tagSelf");
}
