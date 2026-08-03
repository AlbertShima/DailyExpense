const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto('file:///Users/albertshima/Desktop/expense-tracker/index.html');
  browser.on('disconnected', () => process.exit(0));
})();
