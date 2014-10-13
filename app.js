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
    var alias, body, dataPath, pathParts, proxyBaseUrl, proxyPath, proxyUrl, record, requestBody;
    body = '';
    requestBody = '';
    url = url.parse(request.url);
    pathParts = url.path.split('/');
    alias = pathParts[1];
    proxyBaseUrl = mappings[alias];
    proxyPath = pathParts.splice(2).join("/");
    proxyUrl = url.parse("" + proxyBaseUrl + "/" + proxyPath);
    dataPath = proxyUrl.hostname.replace(/[.-]/g, "-");
    record = new Firebase("" + FIREBASE_URL + "/" + dataPath);
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
    var alias, pathParts, proxyBaseUrl, proxyPath, proxyUrl;
    url = url.parse(request.url);
    pathParts = url.path.split('/');
    alias = pathParts[1];
    proxyBaseUrl = mappings[alias];
    if (!proxyBaseUrl) {
      response.writeHead(404);
      response.end("Mapping for " + request.url + " not found.");
      return console.log("ERROR: Mapping for " + request.url + " not found.");
    } else {
      proxyPath = pathParts.splice(2).join("/");
      proxyUrl = url.parse("" + proxyBaseUrl + "/" + proxyPath);
      console.log("PROXY: from " + request.url + " to " + (url.format(proxyUrl)));
      request.url = url.format(proxyUrl);
      return proxy.web(request, response, {
        target: proxyBaseUrl
      });
    }
  }).listen(process.env.PORT || 1337);

}).call(this);
