export NODE_TLS_REJECT_UNAUTHORIZED=0
npm install --dev
while inotifywait -q muBackend.js client.js server.js
do 
  kill `cat .pid`
  sleep 0.1
  ./build.sh
  node server.js $@ &
  echo $! > .pid
  sleep 3
done
