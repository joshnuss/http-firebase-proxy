(function() {
  var FIREBASE_URL, Firebase, http, httpProxy, mappings, mappingsRef, proxy, url, _;

  http = require('http');

  httpProxy = require('http-proxy');

  url = require('url');

  _ = require('underscore');

  Firebase = require("firebase");

  FIREBASE_URL = process.env.FIREBASE_URL;

  if (!FIREBASE_URL) throw "Environment variable FIREBASE_URL is not defined";

  mappingsRef = new Firebase("" + FIREBASE_URL + "/mappings");

  mappings = {};

  mappingsRef.on('value', function(snapshot) {
    var id, mapping, _ref, _results;
    _ref = _.values(snapshot.val());
    _results = [];
    for (id in _ref) {
      mapping = _ref[id];
      _results.push(mappings[mapping.alias] = mapping.url);
    }
    return _results;
  });

  proxy = httpProxy.createProxyServer();

  proxy.on('error', function(e) {
    response.writeHead(500);
    return response.end("Problem with request: " + e.message);
  });

  proxy.on('proxyRes', function(proxyResponse, request, response) {
    var body, record, requestBody, subdomain;
    body = '';
    requestBody = '';
    subdomain = request.headers.host.split('.')[0];
    record = new Firebase("" + FIREBASE_URL + "/" + subdomain);
    request.on('data', function(chunk) {
      return requestBody += chunk;
    });
    proxyResponse.on('data', function(chunk) {
      return body += chunk;
    });
    return proxyResponse.on('end', function() {
      console.log("RESPONSE: " + proxyResponse.statusCode);
      return record.push({
        at: new Date().getTime(),
        request: {
          ip: request.connection.remoteAddress,
          url: request.url,
          method: request.method,
          headers: request.headers,
          body: requestBody
        },
        response: {
          code: proxyResponse.statusCode,
          headers: proxyResponse.headers,
          body: body
        }
      });
    });
  });

  http.createServer(function(request, response) {
    var subdomain, targetDomain, targetUrl;
    subdomain = request.headers.host.split('.')[0];
    targetDomain = mappings[subdomain];
    if (!targetDomain) {
      response.writeHead(404);
      response.end("Mapping for " + request.url + " not found.");
      return console.log("ERROR: Mapping for " + request.url + " not found.");
    } else {
      targetUrl = targetDomain + url.parse(request.url).path;
      console.log("PROXY: from " + request.headers.host + request.url + " to " + targetUrl);
      request.url = targetUrl;
      return proxy.web(request, response, {
        target: targetDomain
      });
    }
  }).listen(process.env.PORT || 1337);

}).call(this);
