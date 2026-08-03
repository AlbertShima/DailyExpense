import { Before, After, BeforeAll, AfterAll, setDefaultTimeout } from '@cucumber/cucumber';
import { chromium, Browser } from 'playwright';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { ExpenseTrackerWorld } from './world';
import { ExpenseTrackerPage } from '../pages/ExpenseTrackerPage';

setDefaultTimeout(30 * 1000);

// The app under test (index.html/app.js/style.css) lives at the repo root,
// one level above this `playwright-cucumber/` framework folder.
const APP_ROOT = path.resolve(__dirname, '../../../');

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
};

let server: http.Server;
let browser: Browser;
let baseUrl: string;

function startStaticServer(): Promise<string> {
  return new Promise((resolve, reject) => {
    server = http.createServer((req, res) => {
      const urlPath = (req.url ?? '/').split('?')[0];
      const filePath = path.join(APP_ROOT, urlPath === '/' ? 'index.html' : urlPath);

      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }
        res.writeHead(200, { 'Content-Type': MIME_TYPES[path.extname(filePath)] ?? 'application/octet-stream' });
        res.end(data);
      });
    });

    server.on('error', reject);
    server.listen(0, () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      resolve(`http://localhost:${port}`);
    });
  });
}

BeforeAll(async () => {
  baseUrl = await startStaticServer();
  browser = await chromium.launch({ headless: process.env.HEADLESS !== 'false' });
});

AfterAll(async () => {
  await browser.close();
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

// Each scenario gets its own browser context, so localStorage (profiles,
// expenses, categories, theme) never leaks between scenarios.
Before(async function (this: ExpenseTrackerWorld) {
  this.context = await browser.newContext();
  this.page = await this.context.newPage();
  this.app = new ExpenseTrackerPage(this.page);
  // The app uses native confirm()/alert() dialogs (e.g. delete confirmation).
  // Auto-accept them so scenarios don't hang on Playwright's default dismiss.
  this.page.on('dialog', (dialog) => dialog.accept());
  await this.page.goto(baseUrl);
});

After(async function (this: ExpenseTrackerWorld) {
  await this.context.close();
});
