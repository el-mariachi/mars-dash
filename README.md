# Functional Programming with Javascript

## mission MARS nasa

Index page displays three Mars rovers with their preview and info.
Info contains Launch Date, Landing Date and Status.
Date of the photos is shown on the full-screen preview of each image.
Click on the rover preview to bring up the corresponding rover's image gallery.
The gallery is opened to the max martian sol of each rover.
Use arrows next to the sol number in the header to select an earlier/later sol.
The gallery display is limited by 25 images per page. If there are more than 25
images available for a particular sol, an appropriate button is rendered.
Click on that button to show more images. Click on an image thumbnail
to view a full-size version.
Click the bottom-right corner of the footer on the index page to view the Astronomy Picture of the Day.

### Instructions

-   `npm install`
-   [Obtain yout personal API key from NASA](https://api.nasa.gov/#browseAPI)
-   Create a file named `.env` in the project root with following contents: `API_KEY=<your_key>`
-   `npm start` to start the server
-   Go to `localhost:3000`

### Netlify deployment

Netlify can only host static content. However, we can utilize Netlify Functions to run server side code.

-   Remove `node-fetch` from dependencies, use [`axios`](https://www.npmjs.com/package/axios)
-   `npm install serverless-http nodemon netlify-lambda`
-   In the server.js or server/index.js code import add `const serverless = require("serverless-http")`
-   Create an Express Router instance: `const router = express.Router()`
-   Add it as middleware `app.use('/.netlify/functions/index', router)`. Replace 'index' with the name of your server code file name if needed.
-   Transform routes from `app.get(...)` to `router.get(...)`
-   Separate server app from server starting code. Export app and a handler from server.js/index.js:\

```js
module.exports = app;
module.exports.handler = serverless(app);
```

-   In the server starting file 'server-local.js' import app and start server:

```js
const app = require('src/server/index');
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
```

-   Add a 'build' script to 'package.json' with `"netlify-lambda build <path to server code directory>"`
-   Add a 'start' script to 'package.json' with `"nodemon server-local"`
-   Create 'netlify.toml' file. Add the build section:\

```toml
[build]
    command = "npm install && npm run build"
    functions = "functions"
```

-   Change all API endpoints in client code to point to `/.netlify/functions/index`
