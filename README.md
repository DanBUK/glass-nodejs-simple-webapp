# glass-nodejs-simple-webapp

## Description

A simple web application demonstrating the usage of the Google Mirror API. Along with expressjs, everyauth and nedb.

## Preparation

Get yourself some API keys from Google. You'll need to configure and application then add the Mirror API to that, finally generate the OAuth keys. Start that [here](https://console.developers.google.com/).

- For AUTHORIZED JAVASCRIPT ORIGINS I normally set both http://127.0.0.1:8080 https://glass-nodejs-simple-webapp.f-box.org/
- For AUTHORIZED REDIRECT URI Set the same, but with the path included /auth/google/callback

## Installation

~~~~ sh
$ git clone https://github.com/DanBUK/glass-nodejs-simple-webapp.git
$ cd glass-nodejs-simple-webapp
$ npm install
$ cp config-example.js config-development.js
$ ${EDITOR} config-development.js # And update the API keys at least.
$ ./server.js
~~~~

You should then be able to access the site at http://127.0.0.1:8080.

## Help

You can always add an Issue to this repo.