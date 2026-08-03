import { test as base } from 'playwright-bdd';
import { ExpenseTrackerPage } from '../pages/ExpenseTrackerPage';

export const test = base.extend<{ app: ExpenseTrackerPage }>({
  app: async ({ page, baseURL }, use) => {
    // The app uses native confirm()/alert() dialogs (e.g. delete confirmation).
    // Auto-accept them so scenarios don't hang on Playwright's default dismiss.
    page.on('dialog', (dialog) => dialog.accept());
    await page.goto(baseURL ?? '/');
    await use(new ExpenseTrackerPage(page));
  },
});
