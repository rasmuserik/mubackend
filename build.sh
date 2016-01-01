./node_modules/.bin/browserify mu.js | 
  ./node_modules/.bin/uglifyjs  |
  cat > mu.min.js
echo '<!-- MACHINE GENERATED - DO NOT EDIT - USE `./dev.sh` -->' > README.md
cat intro.js mu.js backend.js | 
  sed -e "s/^[^/]/    \0/" | sed -e s'/^[/][/] //' | sed -e s/^..$// >> README.md
