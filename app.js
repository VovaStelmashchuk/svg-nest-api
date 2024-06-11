const express = require('express');
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

app.get('/', function (req, res) {
    res.send('Hello World!');
});

require('./nest');
const {HttpStatusCode} = require("axios");

if (!fs.existsSync('data')) {
    fs.mkdirSync('data');
}

app.post('/doNest', async (req, serverResponse) => {
    const id = req.query.id;

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
        serverResponse.status(200).send({
            url: `https://nest2d-prod.ams3.digitaloceanspaces.com/${id}/output.svg`
        });
    });

    writer.on('error', (error) => {
        console.error('Error occurred: ', error);
        // return code 500 from rest api
        serverResponse.status(500).send('Error occurred');
    });
});


app.listen(port, function () {
    console.log('nodeSVGnest websever listening on port ' + port + '!');
});
