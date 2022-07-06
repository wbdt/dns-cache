const dns = require('dns');
const LRUCache = require('lru-cache');
const debug = require('debug')('dns-cache');

// utils function
function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

// dns lookup
function lookupWrapper(lookup, cache) {
    return (hostname, options, callback) => {
        // hostname, callback
        // hostname, family, callback
        // hostname, options, callback

        // fix args
        let family = 0;
        if (!callback) {
            callback = options;
            options = {};
        }
        if (typeof options === 'number') {
            family = options;
            options = {};
        }

        if (family && typeof options === 'object') {
            options.family = family;
        }

        const originOptionAll = options && options.all;

        // when lookup one address, will try to get from cache
        const cacheKey = `${hostname}:${family}:${options.hints || 0}:${options.verbatim || false}`;
        if (!originOptionAll) {
            const addressesCache = cache.get(cacheKey);
            if (addressesCache && Array.isArray(addressesCache)) {
                let cacheItem = {};
                if (addressesCache.length === 1) {
                    cacheItem = addressesCache[0];
                } else if (addressesCache.length > 1) {
                    // pick one of address by random
                    cacheItem = addressesCache[rand(0, addressesCache.length - 1)];
                }

                const { address, family } = cacheItem;
                if (address && family) {
                    debug(`hit dns cache, hostname: ${hostname}, address: ${address}`);
                    return callback(null, address, family);
                }
            }
        }

        // miss cache, then use origin lookup all, and set cache
        options.all = true;

        if (typeof callback === 'function') {
            const callbackWrapper = cb => {
                return (err, address, family) => {
                    // err, address, family
                    // err, addresses

                    // error handle
                    if (err) {
                        return cb(err);
                    }

                    if (address && Array.isArray(address)) {
                        cache.set(cacheKey, address);
                        debug(`set dns cache, hostname: ${hostname}, addresses: ${address.map(item => item.address).join(', ')}`);
                        if (!originOptionAll) {
                            const { address: _address, family: _family } = address[0];
                            address = _address;
                            family = _family;
                        }
                    }

                    debug(`miss dns cache, hostname: ${hostname}, address: ${address}`);
                    return cb(err, address, family);
                };
            };
            callback = callbackWrapper(callback);
        }
        return lookup(hostname, options, callback);
    };
}

module.exports = {
    // wrap dns.lookup() and setup cache, return constom dns lookup function
    lookupWrapper: function (maxCacheItemCount = 100, cacheTTL = 10 * 1000) {
        const cache = new LRUCache({
            max: maxCacheItemCount,
            ttl: cacheTTL,
        });
        return lookupWrapper(dns.lookup, cache);
    },

    // wrap dns.lookup() with cache, and path lookup global
    patchGlobal: function (maxCacheItemCount = 100, cacheTTL = 10 * 1000) {
        const cache = new LRUCache({
            max: maxCacheItemCount,
            ttl: cacheTTL,
        });
        dns.lookup = lookupWrapper(dns.lookup, cache);
    }
};
