const puppeteer = require("puppeteer");
const {getFirstFilePath} = require("./utils");

function delay(time) {
    return new Promise(function (resolve) {
        setTimeout(resolve, time)
    });
}

async function goNest(dirPath, filePath) {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    await page.setViewport({width: 1920, height: 1080})
    await page.goto('http://[::]:3000');

    const fileInput = await page.$('input[type="file"]');
    await fileInput.uploadFile(filePath);

    const rectElement = await page.$('.fullRect');
    await rectElement.click();

    const startButton = await page.$('#start');
    await startButton.click();

    await delay(5000);

    await startButton.click();

    const savedFolder = `${dirPath}/output`;

    const cdpSession = await page.target().createCDPSession();
    await cdpSession.send('Browser.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: savedFolder,
    });

    await delay(1000);

    await page.click('#download');

    await delay(1000);

    await browser.close();

    return getFirstFilePath(savedFolder);
}

module.exports = {goNest};
