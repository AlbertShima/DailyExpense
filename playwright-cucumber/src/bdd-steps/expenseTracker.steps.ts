import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { test } from './fixtures';

const { Given, When, Then } = createBdd(test);

// Same feature file, same step text, same Page Object as the cucumber-js
// suite (see src/steps/expenseTracker.steps.ts) - this layer just runs it
// through the @playwright/test runner instead, for UI mode / trace viewer.
// The leading {string} on every step is the traceability number
// (e.g. "1", "1.2", "2.3"...) from the .feature file; most handlers ignore it.

Given('{string} Open the expense tracker app', async ({ app }, _step: string) => {
  await expect(app.showNewProfileBtn).toBeVisible();
});

Given('{string} Log in with a new profile named {string}', async ({ app }, _step: string, name: string) => {
  await app.showNewProfileBtn.click();
  await app.newProfileNameInput.fill(name);
  await app.startBtn.click();
  await expect(app.appRoot).toBeVisible();
});

When('{string} Click on the button {string}', async ({ app }, _step: string, buttonName: string) => {
  await app.button(buttonName).click();
});

When(
  '{string} Fill the {string} field with {string}',
  async ({ app }, _step: string, fieldName: string, value: string) => {
    await app.field(fieldName).fill(value);
  }
);

When(
  '{string} Select {string} from the {string} dropdown',
  async ({ app }, _step: string, optionLabel: string, _dropdownName: string) => {
    // Options are rendered as "<icon> <label>" (e.g. "🍔 Food & Drink"), so
    // match on the visible label text rather than an exact option label.
    const option = app.categorySelect.locator('option', { hasText: optionLabel }).first();
    const value = await option.getAttribute('value');
    await app.categorySelect.selectOption(value ?? '');
  }
);

When('{string} Click on the first expense entry', async ({ app }, _step: string) => {
  await app.expenseItems.first().click();
});

When('{string} Pick the first icon for the category', async ({ app }, _step: string) => {
  await app.iconChoices.first().click();
});

Then('{string} See the {string}', async ({ app }, _step: string, target: string) => {
  await expect(app.screen(target)).toBeVisible();
});

Then(
  '{string} See {string} in the {string}',
  async ({ app, page }, _step: string, expectedText: string, target: string) => {
    if (target === 'theme attribute') {
      const theme = await page.locator('html').getAttribute('data-theme');
      expect(theme).toBe(expectedText);
      return;
    }
    await expect(app.screen(target)).toContainText(expectedText);
  }
);
