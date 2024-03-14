const express = require('express');
import serverRouter from './routes/index'
const app = express();

app.use(express.json({limit: '50mb'}));

const port = process.env.PORT || 5000;

serverRouter(app)

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
})

module.exports = app;