npm install --dev
while inotifywait -q intro.js mu.js backend.js
do 
  kill `cat .pid`
  cat intro.js mu.js backend.js | 
    sed -e "s/^[^/]/    \0/" | sed -e s'/^[/][/] //' | sed -e s/^..$// > README.md
  sleep 0.1
  node backend.js &
  echo $! > .pid
  sleep 3
done
