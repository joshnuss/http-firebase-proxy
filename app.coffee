http = require('http')
httpProxy = require('http-proxy')
url = require('url')
_ = require('underscore')
Firebase = require("firebase")

FIREBASE_URL = process.env.FIREBASE_URL

throw "Environment variable FIREBASE_URL is not defined" unless FIREBASE_URL

mappingsRef = new Firebase("#{FIREBASE_URL}/mappings")
mappings = {}

mappingsRef.on 'value', (snapshot) ->
  for id, mapping of _.values(snapshot.val())
    mappings[mapping.alias] = mapping.url

proxy = httpProxy.createProxyServer()

proxy.on 'error', (e) ->
  response.writeHead(500)
  response.end("Problem with request: #{e.message}")

proxy.on 'proxyRes', (proxyResponse, request, response) ->
  body = ''
  requestBody = ''

  url = url.parse(request.url)
  pathParts = url.path.split('/')
  alias = pathParts[1]
  proxyBaseUrl = mappings[alias]
  proxyPath = pathParts.splice(2).join("/")
  proxyUrl = url.parse("#{proxyBaseUrl}/#{proxyPath}")
  dataPath = proxyUrl.hostname.replace(/[.-]/g, "-")
  record = new Firebase("#{FIREBASE_URL}/#{dataPath}")

  request.on 'data', (chunk) ->
    requestBody += chunk

  proxyResponse.on 'data', (chunk) ->
    body += chunk

  proxyResponse.on 'end', ->
    console.log("RESPONSE: #{proxyResponse.statusCode}")

    record.push
      at: new Date().getTime()
      request:
        url: request.url
        method: request.method
        headers: request.headers
        body: requestBody
      response:
        code: proxyResponse.statusCode
        headers: proxyResponse.headers
        body: body

http.createServer (request, response) ->
      subdomain = request.headers.host.split('.')[0]
      targetDomain = mappings[subdomain]

      if !targetDomain
        response.writeHead(404)
        response.end("Mapping for #{request.url} not found.")
        console.log("ERROR: Mapping for #{request.url} not found.")
      else
        targetUrl = targetDomain + url.parse(request.url).path

        console.log("PROXY: from #{request.headers.host}#{request.url} to #{targetUrl}")

        request.url = targetUrl

        proxy.web(request, response, {target: targetDomain})

    .listen(process.env.PORT || 1337)
