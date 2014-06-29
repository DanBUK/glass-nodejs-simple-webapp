#!/usr/bin/env node

var NEDB = require('nedb');
var EXPRESS = require('express');
var EVERYAUTH = require('everyauth');
var SERVEFAVICON = require('serve-favicon');
var COOKIEPARSER = require('cookie-parser');
var BODYPARSER = require('body-parser');
var COOKIESESSION = require('cookie-session');

var GOOGLEAPIS = require('googleapis');

var UTIL = require('util');

var app = EXPRESS();

app.use(EXPRESS.static(__dirname + '/public'));
app.use(SERVEFAVICON(__dirname + '/public/favicon.ico'));
app.use(BODYPARSER());
app.use(COOKIEPARSER()); 
app.use(COOKIESESSION({secret: 'mysecretcookie'}));

app.set('view engine', 'jade');
app.set('views', './views');

if ('development' == app.get('env')) {
  var CONFIG = require(__dirname + '/config-development.js');
} else {
  var CONFIG = require(__dirname + '/config-production.js');
}

var getMirrorAPIClient = function (accessToken, refreshToken, callback) {
  var OAuth2Client = new GOOGLEAPIS.OAuth2Client(CONFIG.google.clientId, CONFIG.google.clientSecret, CONFIG.google.redirectUrl);
  OAuth2Client.credentials = {
    access_token: accessToken,
    refresh_token: refreshToken
  };
  
  GOOGLEAPIS.discover('mirror', 'v1')
    .withOpts({ cache: { path: __dirname + '/cache' }})
    .withAuthClient(OAuth2Client)
    .execute(callback);
};


EVERYAUTH.debug = false;

var Users = new NEDB({filename: __dirname + '/data/Users', autoload: true});

var User = function (id, googledata) {
  this.id = id,
  this.googledata = googledata;
};

var addUser = function (doc, callback) {
  Users.insert(doc, callback);
};

var getUserId = function (id, callback) {
  Users.find({id: id}, callback);
};

var updateUsersAccessToken = function (id, accessToken, callback) {
  getUserId(id, function (err, user) {
    var doc = user[0];
    doc.googledata.accessToken = accessToken;
    Users.update({id: id}, doc, function (err, numReplace, newDoc) {
      callback(err, doc);
    });
  });
};

var sendCardToUser = function (id, cardHtml, callback) {
  getUserId(id, function (err, user) {
    if (user.length > 0) {
      var u = user[0];
      getMirrorAPIClient(u.googledata.accessToken, u.googledata.refreshToken, function (err, client) {
        client.mirror.timeline.insert({
          "html": "<article><section>" + cardHtml + "</section></article>",
          "notification": { "level": "DEFAULT" },
          "menuItems": [
            {"action": "DELETE"}
          ]
        }).execute(function (err, data) {
          if (err) {
              console.error("ERROR: sendCardToUser");
              console.error("ID: " + id);
              console.error("MSG:");
              console.error(err);
              if (callback) callback(err, null);
          } else {
            if (client.authClient.credentials.access_token !== u.googledata.accessToken) {
              updateUsersAccessToken(id, client.authClient.credentials.access_token, function () {});
            }
            if (callback) callback(null, true);
          }
        });
      });
    } else {
      if (callback) callback("ERROR: sendCardToUser: Couldn't find that user [" + id + "]", false);
    }
  });
};

EVERYAUTH.everymodule.findUserById( function (userId, callback) {
  getUserId(userId, function (err, user) {
    if (user.length > 0) callback(null, user[0]);
    else callback(null, null);
  });
});

EVERYAUTH.google
  .appId(CONFIG.google.clientId)
  .appSecret(CONFIG.google.clientSecret)
  .myHostname(CONFIG.myHostname)
  .scope('https://www.googleapis.com/auth/userinfo.profile ' 
       + 'https://www.googleapis.com/auth/glass.location '
       + 'https://www.googleapis.com/auth/glass.timeline ')
  .findOrCreateUser(function (sess, accessToken, extra, googleUser) {
    googleUser.accessToken = accessToken;
    googleUser.refreshToken = extra.refresh_token;
    googleUser.expiresIn = extra.expires_in;
    var promise = this.Promise();
    getUserId(googleUser.id, function (err, user) {
      if (err) return promise.fulfill([err]);
      else {
        if (user.length > 0) {
          promise.fulfill(user[0]);
        } else {
          var u = new User (googleUser.id, googleUser);
          addUser(u, function (err, user) {
            if (err) return promise.fulfill([err]);
            else promise.fulfill(user);
          });
        }
      }
    });
    return promise;
  })
  .redirectPath('/');

app.use(EVERYAUTH.middleware(app));

app.get('/', function (req, res) {
  res.render('home');
});

app.get('/send/html', function (req, res) {
  res.render('send/html', {message: "Please input the HTML you wish to send."});
});

app.post('/send/html', function (req, res) {
  if (typeof req.user == "undefined") {
    res.redirect('/');
  } else {
    sendCardToUser(req.user.id, req.body.html, function (err, success) {
      var msg = "HTML Sent!";
      if (err) msg = err.toString();
      res.render('send/html', {message: msg});
    });
  }
});

app.listen(CONFIG.myListenPort, CONFIG.myListenHost);

module.exports = app;