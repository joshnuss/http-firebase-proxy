# HTTP Firebase Proxy

Proxy HTTP requests and record them in **realtime** with Firebase. Useful for debugging REST API calls.

Records the request's url, headers, method, body and response's code, headers and body.

## Installation

```
git clone https://github.com/joshnuss/http-firebase-proxy
```

## Usage

### Start the server

```
FIREBASE_URL=<your-firebase-url> PORT=<port-number> node app.js
```

### Setup a mapping

The proxy allows recording of multiple APIs at once. To accomplish this each URL path going into the proxy starts with an alias. example: `http://localhost:8080/weather`, `/weather` is the alias.

For example, say you want to debug requests for the API `http://api.openweathermap.org`. If your proxy is on `http://localhost:8080`, you can set up a mapping for `http://localhost:8080/weather` to point to `http://api.openweathermap.org`.

To set up the mapping, go to your Firebase URL /mapping, example `https://<my-firebase-id>.firebaseio.com/mappings`

Add a record, with 2 fields, `url` is the target server's URL, and `alias` is the root path name.

### Use the proxy

Instead of `http://api.openweathermap.org/data/2.5/weather?q=Chicago,IL` use `http://localhost:8080/weather/data/2.5/weather?q=Chicago,IL` (notice the `/weather` is added to the path)

```
curl -v http://localhost:8080/weather/data/2.5/weather?q=Chicago,IL
```

### View traffic

Check your firebase dashboard, you will have a `https://<my-firebase-id>.firebaseio.com/api-openweathermap-org` and you can watch as requests come in live.