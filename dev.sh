export NODE_TLS_REJECT_UNAUTHORIZED=0
npm install --dev
while inotifywait -e modify,close_write,move_self -q *.js *.html
do 
  kill `cat .pid`
  sleep 0.1
  ./build.sh
  node mubackend.js $@ &
  echo $! > .pid
  sleep 3
done
