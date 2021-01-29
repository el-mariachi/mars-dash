require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const path = require('path');

const probe = require('probe-image-size');

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/', express.static(path.join(__dirname, '../public')));
app.use('/static', express.static(path.join(__dirname, '../public/static')));

// your API calls

// example API call
app.get('/apod', async (req, res) => {
    try {
        let image = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${process.env.API_KEY}`)
            .then(res => res.json())
        res.send({ image })
    } catch (err) {
        console.log('error:', err);
    }
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));

let ims = probe('https://mars.nasa.gov/msl-raw-images/proj/msl/redops/ods/surface/sol/03003/opgs/edr/ncam/NRB_664084503EDR_S0850000NCAM00594M_.JPG');
ims.then(res => {
    console.log(res);
});