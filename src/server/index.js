require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const path = require('path');
const { List, Map } = require('immutable');

const rovers = List(['curiosity', 'opportunity', 'spirit']);

// TODO not sure about this one
const probe = require('probe-image-size');

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/', express.static(path.join(__dirname, '../public')));
app.use('/static', express.static(path.join(__dirname, '../public/static')));

// Memoization helpers
const generateKey = args => {
    return args.map(arg => {
        if (typeof arg === 'object') {
            return Object.keys(arg).map(key => `${key}<${generateKey([arg[key]])}>`).join(';');
        } else {
            return `${typeof arg}<${arg}>`;
        }

    }).join(',');
}

function memoize(fn, timeout) {
    const cache = {};

    return function (...args) {
        const key = generateKey(args);
        const result = cache[key];

        if (typeof result === 'undefined' || Date.now() > result.expire) {
            console.log('Execute fn');
            return Promise.resolve(fn(...args)).then(value => {
                cache[key] = { value, expire: Date.now() + timeout };
                return value;
            });
        }

        console.log('From cache');

        return Promise.resolve(result.value);
    };
}

const getManifestFor = async rover => {
    let manifests = {};

    let manifest = manifests[rover];
    if (manifest === undefined) {
        let response = await fetch(`https://api.nasa.gov/mars-photos/api/v1/manifests/${rover}?api_key=${process.env.API_KEY}`);
        manifest = manifests[rover] = await response.json();
    }
    return manifest;
};

const getCachedManifest = memoize(getManifestFor, 1000 * 60 * 5); // timeout == 5 min

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
// your API calls
app.get('/index', (req, res) => {
    // get manifests
    allManifests().then(manifests => {
        res.set('Access-Control-Expose-Headers', 'Location');
        res.location('/');
        res.json({ page: 'index', manifests: manifests });
    });
});
app.get('/:roverName', (req, res) => {
    const roverName = req.params.roverName;
    if (!rovers.includes(roverName)) {
        res.status(404);
        res.type('txt').send('Not found');
    } else {
        res.set('Access-Control-Expose-Headers', 'Location');
        res.location(`/${roverName}`);
        res.json({ page: 'rover', rover: roverName });
    }
});

// example API call
app.get('/apod', async (req, res) => {
    try {
        let image = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${process.env.API_KEY}`)
            .then(res => res.json());
        res.send({ image });
    } catch (err) {
        console.log('error:', err);
    }
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));


