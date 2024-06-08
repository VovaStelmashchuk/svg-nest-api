var express = require('express');
const axios = require('axios');
const doNest = require('./nest');
const fs = require("fs");
const {uploadFileToS3, removeRectFromSvg} = require("./utils");

var app = express();
var args = process.argv.slice(2);
var port;

if (args[0]) {
    port = args[0];
} else {
    port = 3000;
}

app.use(express.static('public'));

app.get('/', function (req, res) {
    res.send('Hello World!');
});

require('./nest');

app.post('/upload', async (req, res) => {
    const id = 'test-472394723';

    const url = `https://nest2d-prod.ams3.digitaloceanspaces.com/${id}/input.svg`
    const dirPath = `data/${id}`;
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath);
    }
    const filePath = `${dirPath}/input.svg`;

    const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream'
    });

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    writer.on('finish', async () => {
        const res = await doNest.goNest(dirPath, filePath)
        removeRectFromSvg(res);
        await uploadFileToS3(`${id}/output.svg`, res)
        console.log('Nest result: ', res);
    });

    writer.on('error', (error) => {
        console.error('Error occurred: ', error);
    });

    res.send('File uploaded');
});


app.listen(port, function () {
    console.log('nodeSVGnest websever listening on port ' + port + '!');
});
