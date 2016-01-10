// # common.js
//
// Shared code between client and server
// 
exports.dbName = function(user, id) {
  return ('mu_' + user.replace(/_/g, '-') + '_' + encodeURIComponent(id))
    .toLowerCase().replace(/[^a-z0-9_$()+-]/g, '$');
}
