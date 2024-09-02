require('dotenv').config();

const puppeteer = require('puppeteer');

function err(msg) {
  console.error(msg);
  throw new Error(msg);
}

function checkEnvVar(name) {
  if (!process.env[name]) {
      err(`Environment variable "${name}" is not set.`);
  }
}

const {
  url,
  refreshIntervalSeconds,
  labelAvailableTickets,
  browserPath,
  userDataDir,
  labelBuyTicket,
} = process.env;

checkEnvVar('url');
checkEnvVar('refreshIntervalSeconds'); 
checkEnvVar('labelAvailableTickets');
checkEnvVar('browserPath'); 
checkEnvVar('userDataDir');
checkEnvVar('labelBuyTicket');

let browser;
let page;

function err(msg) {
    console.error(msg);
    throw new Error(msg);
}

async function runScript() {
  try {
    if (!browser) {
      browser = await puppeteer.launch({
        headless: false,
        executablePath: browserPath,
        userDataDir: userDataDir,
      });
    }

    if (page) {
      try {
        await page.close();
      } catch (closeError) {
        console.error('Failed to close the page:', closeError.message);
      }
    }

    page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    const divWithH3 = await page.evaluateHandle((labelAvailableTickets) => {
      const xpath = `//div[h3[contains(text(), '${labelAvailableTickets}')]]`;
      const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      return result.singleNodeValue;
    }, labelAvailableTickets);

    if (!divWithH3) {
        err(`Div containing h3 with text "${labelAvailableTickets}" not found.`);
    }

    const nextDiv = await page.evaluateHandle((divWithH3) => {
      const xpath = `//div[h3[contains(text(), '${divWithH3.querySelector('h3').textContent}')]]/following-sibling::div[1]`;
      const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      return result.singleNodeValue;
    }, divWithH3);

    if (!nextDiv) {
        err('No next sibling <div> found.');
    }

    const anchorHandle = await page.evaluateHandle((nextDiv) => {
      const a = nextDiv.querySelector('a');
      return a;
    }, nextDiv);

    if (!anchorHandle || typeof anchorHandle !== 'object' || !anchorHandle.click) {
        err('No <a> element found inside the next <div>.');
    }

    await Promise.all([
      anchorHandle.click(),
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);

    const labelElementHandle = await page.evaluateHandle((labelBuyTicket) => {
      const xpath = `//*[contains(text(), '${labelBuyTicket}')]`;
      const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      return result.singleNodeValue;
    }, labelBuyTicket);

    if (!labelElementHandle) {
        err(`Label with text "${labelBuyTicket}" not found on the new page.`);
    }

    await labelElementHandle.click();

    console.log('Process completed successfully.');
  } catch (error) {
    console.error('An error occurred:', error.message);
  } finally {
    retry();
  }
}

function retry() {
  console.error(`Retrying in ${refreshIntervalSeconds} seconds...`);
  setTimeout(runScript, refreshIntervalSeconds * 1000);
}

runScript();
