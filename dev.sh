npm install --dev
while inotifywait -q intro.js mu.js backend.js
do 
  kill `cat .pid`
  sleep 0.1
  echo '<!-- MACHINE GENERATED - DO NOT EDIT - USE `./dev.sh` -->' > README.md
  cat intro.js mu.js backend.js | 
    sed -e "s/^[^/]/    \0/" | sed -e s'/^[/][/] //' | sed -e s/^..$// >> README.md
  node backend.js $@ &
  echo $! > .pid
  sleep 3
done
