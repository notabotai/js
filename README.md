# web

Utils for web development as ES6 libraries

## Local dev setup

Run local server

    $ deno task dev

Needs allow-read for reading deno executable, allow-run for running that
executable, and allow-write for writing the deno.lock file of a project to
remove localhost import urls so it takes in new source code from here.

## Things to know

### User project should not export their App

Because deno puts that export at the bottom of the generated bundle
public/app.js in user project, but browsers don't allow that.
