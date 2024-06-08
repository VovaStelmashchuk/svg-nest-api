const fs = require("fs");
const path = require("node:path");

function getFirstFilePath(directoryPath) {
    return new Promise((resolve, reject) => {
        fs.readdir(directoryPath, (err, files) => {
            if (err) {
                reject('Unable to scan directory: ' + err);
            } else if (files.length === 0) {
                reject('Directory is empty');
            } else {
                const firstFile = files[0];
                const firstFilePath = path.join(directoryPath, firstFile);

                resolve(firstFilePath);
            }
        });
    });
}

const {S3Client, PutObjectCommand} = require("@aws-sdk/client-s3");

// Configure AWS SDK
require('dotenv').config();

const s3Client = new S3Client({
    region: 'ams3',
    credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID,
        secretAccessKey: process.env.SECRET_ACCESS_KEY
    },
    endpoint: 'https://ams3.digitaloceanspaces.com'
});

async function uploadFileToS3(fileKey, filePath) {
    const bucketName = 'nest2d-prod';
    const fileContent = fs.readFileSync(filePath);

    // Set the parameters
    const params = {
        Bucket: bucketName,
        Key: fileKey,
        Body: fileContent,
        ACL: 'public-read',
    };

    // Upload the file
    try {
        const command = new PutObjectCommand(params);
        const data = await s3Client.send(command);
        console.log(`File uploaded successfully. ${data.Location}`);
    } catch (err) {
        console.error('Error uploading file: ', err);
    }
}

const jsdom = require('jsdom');
const {JSDOM} = jsdom;

function removeRectFromSvg(filePath) {
    const svg = fs.readFileSync(filePath, 'utf-8');

    const dom = new JSDOM(svg);
    const document = dom.window.document;

    const rects = document.querySelectorAll('rect.bin');

    // Remove each <rect> element
    rects.forEach(rect => rect.parentNode.removeChild(rect));

    const svgElement = document.querySelector('svg');

    // Serialize the SVG and replace <path></path> with <path/>
    let serializedSvg = svgElement.outerHTML;
    serializedSvg = serializedSvg.replace(/<path([^>]*)><\/path>/g, '<path$1/>');

    fs.writeFileSync(filePath, serializedSvg);
}

module.exports = {getFirstFilePath, uploadFileToS3, removeRectFromSvg};