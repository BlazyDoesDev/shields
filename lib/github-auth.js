// TODO:
// - add route in server.js
// - document user authorization in try.html

var querystring = require('querystring');
var request = require('request');
var serverSecrets;
try {
  // Everything that cannot be checked in but is useful server-side
  // is stored in this JSON data.
  serverSecrets = require('../secret.json');
} catch(e) {}

function setRoutes(server) {
  server.route(/^\/github-auth$/, function(data, match, end, ask) {
    if (!(serverSecrets && serverSecrets.gh_client_id)) {
      return end('This server is missing GitHub client secrets');
    }
    var query = querystring.stringify({
      client_id: serverSecrets.gh_client_id,
      redirect_uri: 'https://img.shields.io/github-auth/done',
    });
    ask.res.statusCode = 302;  // Found.
    ask.res.setHeader('Location', 'https://github.com/login/oauth/authorize?' + query);
    end('');
  });
  server.route(/^\/github-auth\/done$/, function(data, match, end, ask) {
    if (!(serverSecrets && serverSecrets.gh_client_id)) {
      return end('This server is missing GitHub client secrets');
    }
    try {
    var options = {
      url: 'https://github.com/login/oauth/access_token',
      headers: {
        'Content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'User-Agent': 'Shields.io',
      },
      form: querystring.stringify({
        client_id: serverSecrets.gh_client_id,
        client_secret: serverSecrets.gh_client_secret,
        code: data.code,
      }),
      method: 'POST',
    };
    } catch(e) { console.error('GitHub OAuth URL computation failed'); }
    console.log(JSON.stringify(options));
    request.post(options, function(err, res, body) {
      if (err != null) { return end('The connection to GitHub failed'); }
      console.log('GitHub OAuth: ' + JSON.stringify(body));
      try {
        var content = querystring.parse(body);
      } catch(e) { return end('The GitHub OAuth token could not be parsed'); }
      end('Done!');
    });
  });
};

exports.setRoutes = setRoutes;
