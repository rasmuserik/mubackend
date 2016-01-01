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
