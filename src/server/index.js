const express = require('express');
const os = require('os');
const path = require('path');
const sass = require(path.join(__dirname, '../server/sass.scss'));
console.log(sass);


const app = express();

// app.use('/public', express.static(path.join(__dirname, '../../public')));
app.use(express.static('dist'));
app.get('/api/getUsername', (req, res) => res.send({ username: os.userInfo().username }));
app.listen(8080, () => console.log('Listening on port 8080!'));
