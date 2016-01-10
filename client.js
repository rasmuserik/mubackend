// # client.js
//
var PouchDB = window.PouchDB

// ## Initialisation
//


window.MuBackend = function MuBackend(url) {
  var self = this;
  var loginFn;
  url = url + (url[url.length -1] === '/' ? "" : "/");
  this._url = url;
  this.userId = window.localStorage.getItem('mubackend' + url + 'userId');
  this._token = window.localStorage.getItem('mubackend' + url + '_token');
  if(!this.userId && window.location.hash.indexOf("muBackendLoginToken=") !== -1) {
    var token = window.location.hash.replace(/.*muBackendLoginToken=/, "");
    this._rpc('loginToken', token, function(result) {
      result = result || {};
      if(result.user && result.token) {
        self._signIn(result.user, result.token);
      } 
    });
  }
};

MuBackend.prototype._rpc = function(name) {
  var args = Array.prototype.slice.call(arguments, 1);
  var cb = args[args.length - 1];
  var xhr = new XMLHttpRequest();
  xhr.open("POST", this._url + "mu/" + name);
  xhr.send(JSON.stringify(args.slice(0, -1)));
  xhr.onreadystatechange = function() {
    if(xhr.readyState === XMLHttpRequest.DONE) {
      if(xhr.status === 200) {
        console.log(xhr.responseText);
        cb.apply(null, JSON.parse(xhr.responseText));
      } else {
        cb("HTTP-error: " + xhr.status);
      }
    }
  };
}
MuBackend.prototype._signIn = function(userId,_token) {
  window.localStorage.setItem('mubackend' + this._url + 'userId', (this.userId = userId) || "");
  window.localStorage.setItem('mubackend' + this._url + '_token', (this._token = _token) || "");
}
MuBackend.prototype.signIn = function(userId, password) {
  var self = this;
  this._rpc('loginPassword', userId, password, function(err) {
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
  this._rpc('createDB', this.userId, dbName, !isPublic, this._token, cb || function() {});
};
MuBackend.prototype.newPouchDB = function(dbName, userId)  {
  userId = userId || this.userId;
  var url = this._url + "db/" + require('./common.js').dbName(userId, dbName);
  if(this.userId) {
        url = url.replace('//', '//' +  this.userId + ':' + this._token + '@');
  }
  return new PouchDB(url);
};
// ## Messaging
// ### Inbox
MuBackend.prototype.send = function(user, inbox, message, cb) {
  this._rpc('send', user, inbox, message, cb || function() {});
};
MuBackend.prototype.inbox = function(inbox) {
  this.createDB("inbox_" + inbox);
  return this.newPouchDB("inbox_" + inbox);
};
// ## Directory
// 
MuBackend.prototype.findTagged = function(tag) {
  console.log("TODO: findTagged");
}
MuBackend.prototype.tagSelf = function(tag, t) {
  console.log("TODO: tagSelf");
}
