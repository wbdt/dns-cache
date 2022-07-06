# dns-cache
Node.js DNS cache patch, cache DNS address result with custom global TTL


## Install

```
npm i @wbdt/dns-cache
```

## Usage

patch global

```js
// write in your app entry point js file

// or write in single js file, like named 'patch-dns-lookup.js',
// then start your app require this js file, like 'node -r path-dns-lookup.js app.js'

const dnsCache = require('@wbdt/dns-cache');
const maxCacheItemCount = 100;
const cacheTTL = 10 * 1000;
dnsCache.patchGlobal(maxCacheItemCount, cacheTTL);
```

get wrapped dns lookup function

```js
const dnsCache = require('@wbdt/dns-cache');
const maxCacheItemCount = 100;
const cacheTTL = 10 * 1000;
const lookup = dnsCache.lookupWrapper(maxCacheItemCount, cacheTTL);

// demo
const http = require('http');
const req = http.request(
    'http://www.baidu.com/404',
    {
        lookup, // use custom lookup function
    },
    res => {
        // ...
    },
);

req.on('error', err => {
    // ...
});

req.end();
```
