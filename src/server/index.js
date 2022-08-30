require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const path = require('path');
const serverless = require('serverless-http');
const { List } = require('immutable');

const rovers = List(['curiosity', 'opportunity', 'spirit']);

const app = express();
// const port = process.env.PORT || 3000;
const photoLimit = 25;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const router = express.Router();

app.use('/', express.static(path.join(__dirname, '../public')));
app.use('/.netlify/functions/index', router); // this maps API calls from client
// app.use('/', (req, res) => { res.sendFile(path.join(__dirname, 'src/public/index.html')) });
// app.use('/static', express.static(path.join(__dirname, '../public/static')));

// Memoization helper
const generateKey = args => {
    return args.map(arg => {
        if (typeof arg === 'object') {
            return Object.keys(arg).map(key => `${key}<${generateKey([arg[key]])}>`).join(';');
        } else {
            return `${typeof arg}<${arg}>`;
        }

    }).join(',');
}
/**
 * Returns a memoized version of an async function
 * Uses argument list as a key, so when a function is called with the same
 * set of values its result is fetched from cache
 * @param {function} fn The function to be memoized
 * @param {number} timeout Data validity timeout in milliseconds
 * @returns {function} Memoized async function
 */
function memoize(fn, timeout) {
    const cache = {};

    return function (...args) {
        const key = generateKey(args);
        const result = cache[key];

        if (typeof result === 'undefined' || Date.now() > result.expire) {
            // console.log('Execute fn');
            return Promise.resolve(fn(...args)).then(value => {
                cache[key] = { value, expire: Date.now() + timeout };
                return value;
            });
        }
        // console.log('From cache');
        return Promise.resolve(result.value);
    };
}

const getManifestFor = async rover => {
    const response = await fetch(`https://api.nasa.gov/mars-photos/api/v1/manifests/${rover}?api_key=${process.env.API_KEY}`);
    const manifest = await response.json();
    return manifest;
};
// memoized getManifestFor
const getCachedManifest = memoize(getManifestFor, 1000 * 60 * 5); // timeout == 5 min

/**
 * Iterates over the rovers array to collect manifests,
 * which is an async operation resulting in an array of promises.
 * That's why we need Promise.all.
 * @returns {Promise} 
 */
const allManifests = async () => {
    const mans = Promise.all(rovers.map(async (rover) => {
        try {
            const man = await getCachedManifest(rover);
            delete man.photo_manifest.photos;
            return man.photo_manifest;
        } catch (err) {
            throw err;
        }
    }));
    return mans;
};

/**
 * Makes an API call to get photo data from NASA.
 * Reurrns a promise that resolves to an object with photo data sorted by id in reverse order
 * starting at 'skip' and containing 'limit' number items.
 * @param {string} rover Rover name
 * @param {number} sol The sol of the photos to be requested
 * @param {number} skip Data is returned starting from this count
 * @param {number} limit Max number of items in the returned result. Defaults to photoLimit
 * @returns {Promise} A promise that resolves to an object
 */
const getImagesForRover = async (rover, sol, skip, limit = photoLimit) => {
    const response = await fetch(`https://api.nasa.gov/mars-photos/api/v1/rovers/${rover}/photos?sol=${sol}&api_key=${process.env.API_KEY}`).then(res => res.json());
    const returnedSize = response.photos.length;
    const photos = List(response.photos).sort((a, b) => b.id - a.id).skip(skip).take(limit);
    const nextSkip = skip + limit;
    const prevSkip = skip - limit;
    const hasEarlierImages = returnedSize - nextSkip > 0 ? true : false;
    const hasLaterImages = skip > 0 ? true : false;
    return { page: 'rover', rover, nextSkip, prevSkip, hasEarlierImages, hasLaterImages, photos };
};

const getCachedImages = memoize(getImagesForRover, 1000 * 60 * 2); // timeout == 2 min

// your API calls


/**
 * Used for index page. Returns rover manifest data
 */
router.get('/index', (req, res) => {
    console.log('index route hit');
    // get manifests
    allManifests().then(manifests => {
        res.set('Access-Control-Expose-Headers', 'Location');
        res.location('/');
        res.json({ page: 'index', manifests: manifests });
    });
});

// APOD API call
router.get('/apod', async (req, res) => {
    try {
        let image = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${process.env.API_KEY}`)
            .then(res => res.json());
        res.set('Access-Control-Expose-Headers', 'Location');
        res.location('/apod');
        res.json({ page: 'apod', apod: image });
    } catch (err) {
        console.log('error:', err);
    }
});

/**
 * Used for rover page. Returns photo data
 */
router.get('/:roverName/:sol?/:skip?', async (req, res) => {
    const roverName = req.params.roverName;
    if (!rovers.includes(roverName)) { // send error page for bad requests
        res.status(404);
        res.type('txt').send('Not found');
    } else {
        // fetch data
        const maxSol = await getCachedManifest(roverName).then(res => res.photo_manifest.max_sol);
        const sol = req.params.sol === undefined ? maxSol : parseInt(req.params.sol);
        const skip = req.params.skip === undefined ? 0 : parseInt(req.params.skip);
        const hasEarlierSol = sol > 1 ? true : false;
        const hasLaterSol = sol < maxSol ? true : false;
        const header = { sol, hasEarlierSol, hasLaterSol };
        // prep headers
        res.set('Access-Control-Expose-Headers', 'Location');
        res.location(`/${roverName}`);
        // send response
        getCachedImages(roverName, sol, skip).then(data => {
            res.json(Object.assign(data, { header }));
        });
    }
});

// app.listen(port, () => console.log(`Example app listening on port ${port}!`));

module.exports = app;
// module.exports.handler = serverless(app);
module.exports.handler = function (event, context, callback) {
    // The event object contains information about the request
    // The callback argument is how you return information to the caller and follows a pretty standard form of: callback(error, result)

    let data = {
        name: 'john',
        time: Date.now()
    };

    console.log('data:' + JSON.stringify(data));

    callback(null, {
        statusCode: 200,
        body: JSON.stringify(data)
    });
}