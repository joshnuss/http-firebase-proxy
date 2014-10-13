# HTTP Firebase Proxy

A node server for easily recording HTTP requests. Requests are stored in Firebase so that they can be viewed in realtime. Useful for debugging REST API calls in production.

Records the request's url, ip, headers, method, body and response's code, headers and body.

```
git clone https://github.com/joshnuss/http-firebase-proxy
```

## Usage

### Start the server

```
FIREBASE_URL=<your-firebase-url> PORT=<port-number> node app.js
```

### Setup a subdomain mapping

The proxy allows recording of multiple APIs at once. To accomplish this each URL path going into the proxy uses a subdomain alias.

For example, say you want to debug requests for the API `http://api.openweathermap.org`. If your proxy is on `http://local.dev`, you can set up a mapping for `http://weather.local.dev` to point to `http://api.openweathermap.org`.

To set up the mapping, go to your Firebase URL /mapping, example `https://<my-firebase-id>.firebaseio.com/mappings`

Add a record, with 2 fields, `url` is the target server's URL, and `alias` is the subdomain.

### Use the proxy

Instead of `http://api.openweathermap.org/data/2.5/weather?q=Chicago,IL` use `http://weather.local.dev/data/2.5/weather?q=Chicago,IL`

```
curl -v http://weather.local.dev/data/2.5/weather?q=Chicago,IL
```

### View traffic

Check your firebase dashboard, you will have a `https://<my-firebase-id>.firebaseio.com/weather` and you can watch as requests come in live.

## License

MIT

A project by Joshua Nussbaum, freelance software consultant. joshnuss AT gmail.com
