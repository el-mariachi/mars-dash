// making an HTTP GET request using builtin libs only

require('dotenv').config();
const https = require('https');
const rover = 'spirit';
const options = {
    method: 'GET',
    hostname: 'api.nasa.gov',
    port: 443,
    path: `/mars-photos/api/v1/manifests/${rover}?api_key=${process.env.API_KEY}`
};

const req = https.request(options, res => {
    console.log(`Status code: ${res.statusCode}`);
    // res is a stream. we need to listen to it's 'data' event
    // to get data which comes in chunks
    res.on('data', d => {
        console.log('data');
        process.stdout.write(d);
    });
    // Here we are just writing data to stdout. We could have also 
    // appended it to a string variable for later processing, like JSON.parse();
    // That we could do in an event hanler for the 'end' event:
    res.on('end', () => {
        console.log('Finished receiving chunks');
    });
});

req.on('error', error => {
    console.log(error);
});
req.end();