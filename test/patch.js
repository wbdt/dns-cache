const { describe, it, before } = require('mocha');
const { strict: assert } = require('assert');
const http = require('http');
const https = require('https');
const dgram = require('dgram');
const { spawn } = require('child_process');
const debug = require('debug')('dns-cache-test');
const dnsCache = require('../src/index');

before('before test, prepare dependent resources', () => {
    // start udp server, for udp dns lookup patch test
    const udpMock = spawn('node', [`${__dirname}/helper/udp-server.js`]);

    udpMock.stdout.on('data', (data) => {
        debug(`udp server stdout: ${data}`);
    });

    udpMock.stderr.on('data', (data) => {
        debug(`udp server stderr: ${data}`);
    });

    udpMock.on('close', (code) => {
        debug(`udp server close, exit code: ${code}`);
    });
});

describe('wrap', function () {
    it('http dns lookup wrap', async () => {
        const lookup = dnsCache.lookupWrapper();

        for (let i = 0; i < 3; i++) {
            const { status, data } = await new Promise((resolve, reject) => {
                const req = http.request('http://httpbin.org/404', {
                    lookup,
                }, (res) => {
                    if (res.statusCode > 300 && res.statusCode < 400) {
                        resolve({ status: res.statusCode, data: null });
                    } else {
                        const chunks = [];
                        res.on('data', (chunk) => {
                            chunks.push(chunk);
                        });
                        res.on('end', () => {
                            resolve({ status: res.statusCode, data: Buffer.concat(chunks).toString() });
                        });
                        res.on('error', err => {
                            reject(err);
                        });
                    }
                });

                req.on('error', err => {
                    reject(err);
                });

                req.end();
            });
            assert.equal(status, 404);
        }
    });

    it('dns cache patch global', async () => {
        dnsCache.patchGlobal(10, 30 * 1000);

        // http
        for (let i = 0; i < 2; i++) {
            const { status, data } = await new Promise((resolve, reject) => {
                const req = http.request('http://httpbin.org/404', (res) => {
                    if (res.statusCode > 300 && res.statusCode < 400) {
                        resolve({ status: res.statusCode, data: null });
                    } else {
                        const chunks = [];
                        res.on('data', (chunk) => {
                            chunks.push(chunk);
                        });
                        res.on('end', () => {
                            resolve({ status: res.statusCode, data: Buffer.concat(chunks).toString() });
                        });
                        res.on('error', err => {
                            reject(err);
                        });
                    }
                });

                req.on('error', err => {
                    reject(err);
                });

                req.end();
            });
            assert.equal(status, 404);
        }

        // https
        for (let i = 0; i < 2; i++) {
            const { status, data } = await new Promise((resolve, reject) => {
                const req = https.request('https://httpbin.org/404', (res) => {
                    if (res.statusCode > 300 && res.statusCode < 400) {
                        resolve({ status: res.statusCode, data: null });
                    } else {
                        const chunks = [];
                        res.on('data', (chunk) => {
                            chunks.push(chunk);
                        });
                        res.on('end', () => {
                            resolve({ status: res.statusCode, data: Buffer.concat(chunks).toString() });
                        });
                        res.on('error', err => {
                            reject(err);
                        });
                    }
                });

                req.on('error', err => {
                    reject(err);
                });

                req.end();
            });
            assert.equal(status, 404);
        }

        // udp
        const client = dgram.createSocket('udp4');
        client.on('error', (err) => {
            console.log('udp error', err);
            client.close();
        });
        const host = 'localhost';
        const port = 41234;
        for (let i = 0; i < 3; i++) {
            const msg = 'hello upd server';
            const bytes = await new Promise((resolve, reject) => {
                client.send(msg, port, host, (err, bytes) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(bytes);
                    }
                });
            });
            assert.equal(bytes, msg.length);
        }
        client.send('EXIT', port, host);
        client.close();

    });
});
