while inotifywait -q server.js
do 
  kill `cat .pid`
  sleep 0.1
  node server.js &
  echo $! > .pid
  sleep 1
done
