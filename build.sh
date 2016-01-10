./node_modules/.bin/browserify client.js | 
  cat > mu.min.js
#  ./node_modules/.bin/uglifyjs  |
echo '<!-- MACHINE GENERATED - DO NOT EDIT - USE `./dev.sh` -->' > README.md
for file in muBackend.js client.js server.js
do
  cat $file | sed -e "s/^[^/]/    \0/" | sed -e s'/^[/][/] \?//' >> README.md
done
