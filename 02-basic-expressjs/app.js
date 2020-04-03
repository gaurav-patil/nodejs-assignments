const express = require('express');

const app = express();

app.use('/users', (req, res, next) => {
    console.log('Users Middleware');
    res.send('<p>The Middleware that just handles /Users path</p>');
});

app.use('/', (req, res, next) => {
    console.log('/ Middleware');
    res.send('<p>The Middleware that just handles / path</p>');
});

app.listen(4000);