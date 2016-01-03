./node_modules/.bin/browserify client.js | 
  ./node_modules/.bin/uglifyjs  |
  cat > mu.min.js
echo '<!-- MACHINE GENERATED - DO NOT EDIT - USE `./dev.sh` -->' > README.md
for file in muBackend.js client.js server.js
do
  echo "# $file" >> README.md; echo "" >> README.md
  cat $file | sed -e "s/^[^/]/    \0/" | sed -e s'/^[/][/] \?//' >> README.md
done
