const dgram = require('dgram');
const server = dgram.createSocket('udp4');
server.on('error', (err) => {
    console.log(`udp server error:\n${err.stack}`);
    server.close();
});
server.on('message', (msg, rinfo) => {
    console.log(`udp server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
    if (msg.toString() === 'EXIT') {
        server.close();
    }
});
server.on('listening', () => {
    const address = server.address();
    console.log(`udp server listening ${address.address}:${address.port}`);
});
server.bind(41234, '127.0.0.1');