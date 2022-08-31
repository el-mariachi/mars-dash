import app from './src/server/index.js';

const port = process.env.PORT || 3000;

app.listen(port, () => console.log(`Mars server app listening on port ${port}!`));