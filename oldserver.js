var server = require('http').createServer();
var p2pserver = require('socket.io-p2p-server').Server
var io = require('socket.io')(server);
io.use(p2pserver);

daemons = [];
function daemon_emit(id, obj) {
  if(daemons.length) {
    var daemon = daemons[(Math.random() * daemons.length) |0];
    daemon.emit(id, obj);
    return daemon;
  }
}
function add_daemon(socket) {
  daemons.push(socket); 
  socket.on("disconnect", function() {
    daemons = daemons.filter(function(s) { return s !== socket; });
  });
}

io.on('connection', function(socket) {
  require('request')({url: "http://localhost/db/_session",
    headers: {cookie: socket.handshake.headers.cookie}}, 
    function(_, _, data) {
      var username;
      try { username = JSON.parse(data).userCtx.name; } catch(e) {};
      if(username === "daemon") add_daemon(socket);
      daemon_emit("server-log", {
        type: "socket-connect", 
        socket: socket.id,
        timestamp: +Date.now(),
        user: username});
    });
  socket.on("disconnect", function() {
    daemon_emit("server-log", { type: "socket-disconnect", socket: socket.id, timestamp: +Date.now()});
  });
});

var reqs = {};
function http_response(o) {
  while(reqs[o.url] && reqs[o.url].length) {
    var res = reqs[o.url].pop();
    res.writeHead(o.statusCode || 200, o.headers || {});
    res.end(o.content || "", o.encoding || "utf8"); }
  reqs[o.url] = null; 
   daemon_emit("server-log", { type: "http-response", url: o.url, timestamp: +Date.now()});
}
server.on('request', function(req, res) {
  var url = req.url;
  if(url.slice(0,10) !== "/socket.io") {
    if(daemons.length && req.method === "GET") {
      if(reqs[url]) {
        reqs[url].push(res);
      } else {
        var daemon = daemon_emit("http-request", { url: url, headers: req.headers});
        daemon_emit("server-log", {
          type: "http-request",
          url: url,
          timestamp: +Date.now(),
          headers: req.headers});
        if(!daemon.http_listener) {
          daemon.on("http-response", http_response);
          daemon.http_listener = true; 
        }
        reqs[url] = [res]; 
      } 
    } else {
      res.end();
    }
  }
});

server.listen(1234, function() { console.log("listening on 1234");});
