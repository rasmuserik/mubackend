export NODE_TLS_REJECT_UNAUTHORIZED=0
npm install --dev
while inotifywait -q intro.js mu.js backend.js
do 
  kill `cat .pid`
  sleep 0.1
  ./build.sh
  node backend.js $@ &
  echo $! > .pid
  sleep 3
done
