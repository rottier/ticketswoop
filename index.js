require('dotenv').config();

const puppeteer = require('puppeteer');

const {
  url,
  refreshIntervalSeconds,
  labelAvailableTickets,
  browserPath,
  userDataDir,
  labelBuyTicket,
} = process.env;

if (!labelAvailableTickets) {
  console.error('Environment variable "labelAvailableTickets" is not set.');
  process.exit(1);
}

if (!refreshIntervalSeconds) {
  console.error('Environment variable "refreshIntervalSeconds" is not set.');
  process.exit(1);
}

let browser; // Browser instance to keep open

function err(msg) {
    console.error(msg);
    throw new Error(msg);
}

async function runScript() {
  let page;
  try {
    // Initialize the browser if not already done
    if (!browser) {
      browser = await puppeteer.launch({
        headless: true,
        executablePath: browserPath,
        userDataDir: userDataDir,
      });
    }

    // Create a new page for the current operation
    page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Find the div containing the h3 with the labelAvailableTickets text
    const divWithH3 = await page.evaluateHandle((labelAvailableTickets) => {
      const xpath = `//div[h3[contains(text(), '${labelAvailableTickets}')]]`;
      const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      return result.singleNodeValue;
    }, labelAvailableTickets);

    if (!divWithH3) {
        err(`Div containing h3 with text "${labelAvailableTickets}" not found.`);
    }

    // Find the next sibling div
    const nextDiv = await page.evaluateHandle((divWithH3) => {
      const xpath = `//div[h3[contains(text(), '${divWithH3.querySelector('h3').textContent}')]]/following-sibling::div[1]`;
      const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      return result.singleNodeValue;
    }, divWithH3);

    if (!nextDiv) {
        err('No next sibling <div> found.');
    }

    // Find the <a> element inside the nextDiv
    const anchorHandle = await page.evaluateHandle((nextDiv) => {
      const a = nextDiv.querySelector('a');
      return a;
    }, nextDiv);

    if (!anchorHandle || typeof anchorHandle !== 'object' || !anchorHandle.click) {
        err('No <a> element found inside the next <div>.');
    }

    // Click the <a> element
    await Promise.all([
      anchorHandle.click(),
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);

    // Find and click the labelBuyTicket on the new page
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
    // Close the page but keep the browser open
    if (page) {
      try {
        await page.close();
      } catch (closeError) {
        console.error('Failed to close the page:', closeError.message);
      }
    }
    retry();
  }
}

function retry() {
  console.error(`Retrying in ${refreshIntervalSeconds} seconds...`);
  setTimeout(runScript, refreshIntervalSeconds * 1000);
}

// Start the script
runScript();
