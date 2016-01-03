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
  this._url = url;
  this._socket = (socket = io(url));
  this._listeners = {};
  this.userId = window.localStorage.getItem('mubackend' + url + 'userId');
  this._token = window.localStorage.getItem('mubackend' + url + '_token');
  socket.on('connect', function() { self.emit('connect'); });
  socket.on('disconnect', function() { self.emit('disconnect'); });
  socket.on('message', function(chanId, msg) { self._emit(chanId, msg); });
  if(window.location.hash.indexOf("muBackendLoginToken=") !== -1) {
    loginFn = function() {
      var token = window.location.hash.replace(/.*muBackendLoginToken=/, "");
      socket.emit('loginToken', token, function(result) {
        result = result || {};
        if(result.user && result.token) {
          self._signIn(result.user, result.token);
        } 
      });
      window.setTimeout(function() { self.removeListener('connect', loginFn); }, 0);
    }
    this.on('connect', loginFn);
  }
  self.on('connect', function resubscribe() { self._resubscribe(); });
};
MuBackend.prototype._signIn = function(userId,_token) {
  window.localStorage.setItem('mubackend' + this.url + 'userId', (this.userId = userId));
  window.localStorage.setItem('mubackend' + this.url + '_token', (this._token = _token));
  this.emit(userId ? 'signin' : 'signout');
}
MuBackend.prototype.signIn = function(userId, password) {
  var self = this;
  this._socket.emit('loginPassword', userId, password, function(err) {
    if(!err) {
      self._signIn(userId, password);
    }
  });
};
MuBackend.prototype.signInWith = function(provider) {
  window.location.href = this._url + 'auth/' + provider + '?' + window.location.href;
};
MuBackend.prototype.signOut = function () {
  this._signIn(undefined, undefined, undefined);
};
// ## Storage
//
MuBackend.prototype.createDB = function(dbName, isPublic)  {
  var self = this;
  return new Promise(function(resolve, reject) {
  self._socket.emit('createDatabase', 
      self.userId, dbName, !isPublic, self._token, function(err) {
        if(err) { reject(err); } else { resolve(); }});
  });
};
MuBackend.prototype.newPouchDB = function(userId, dbName, PouchDB)  {
  self = this;
  return new Promise(function(resolve, reject) {
    self._socket.emit('databaseUrl', userId, dbName, function(url) {
      if(self.userId) {
        url = url.replace('//', '//' +  self.userId + ':' + self._token + '@');
      }
      PouchDB = PouchDB || window.PouchDB;
      resolve(new PouchDB(url));
    });
  });
};
// ## Messaging
//
MuBackend.prototype._getChan = function(chanId) {
  return this._listeners[chanId] || (this._listeners[chanId] = []);
}
MuBackend.prototype._subscribe = function(chanId) {
  this._socket.emit('sub', chanId, this._token);
}
MuBackend.prototype._resubscribe = function() {
  var self = this;
  Object.keys(this._listeners).forEach(function(chanId) {
    if(chanId.indexOf(':') !== -1 && self._listeners[chanId].length) {
      self._subscribe(chanId);
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
      this._socket.emit('unsub', chanId);
    }
  }
};
MuBackend.prototype._emit = function(chanId, params)  {
  this._getChan(chanId).forEach( function(f) { f.apply(null, params); });
};
MuBackend.prototype.emit = function(chanId)  {
  var params = Array.prototype.slice.call(arguments, 1);
  if(chanId.indexOf(':') !== -1) {
    this._socket.emit('pub', chanId, params);
  } else {
    this._emit(chanId, params);
  }
};
MuBackend.prototype.emitOnce = function(chanId, message)  {
  var params = Array.prototype.slice.call(arguments, 1);
  this._socket.emit('pubOnce', chanId, params);
};
// ## Directory
// 
MuBackend.prototype.findTagged = function(tag) {
  console.log("TODO: findTagged");
  return new Promise();
}
MuBackend.prototype.tagSelf = function(tag, t) {
  console.log("TODO: tagSelf");
}
