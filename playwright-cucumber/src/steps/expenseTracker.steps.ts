import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { ExpenseTrackerWorld } from '../support/world';

// The leading {string} on every step is the traceability number
// (e.g. "1", "1.2", "2.3"...) coming from the .feature file. It is only
// used for readable failure output, so most handlers ignore its value.

Given('{string} Open the expense tracker app', async function (this: ExpenseTrackerWorld, _step: string) {
  await expect(this.app.showNewProfileBtn).toBeVisible();
});

Given(
  '{string} Log in with a new profile named {string}',
  async function (this: ExpenseTrackerWorld, _step: string, name: string) {
    await this.app.showNewProfileBtn.click();
    await this.app.newProfileNameInput.fill(name);
    await this.app.startBtn.click();
    await expect(this.app.appRoot).toBeVisible();
  }
);

When(
  '{string} Click on the button {string}',
  async function (this: ExpenseTrackerWorld, _step: string, buttonName: string) {
    await this.app.button(buttonName).click();
  }
);

When(
  '{string} Fill the {string} field with {string}',
  async function (this: ExpenseTrackerWorld, _step: string, fieldName: string, value: string) {
    await this.app.field(fieldName).fill(value);
  }
);

When(
  '{string} Select {string} from the {string} dropdown',
  async function (this: ExpenseTrackerWorld, _step: string, optionLabel: string, _dropdownName: string) {
    // Options are rendered as "<icon> <label>" (e.g. "🍔 Food & Drink"), so
    // match on the visible label text rather than an exact option label.
    const option = this.app.categorySelect.locator('option', { hasText: optionLabel }).first();
    const value = await option.getAttribute('value');
    await this.app.categorySelect.selectOption(value ?? '');
  }
);

When('{string} Click on the first expense entry', async function (this: ExpenseTrackerWorld, _step: string) {
  await this.app.expenseItems.first().click();
});

When('{string} Pick the first icon for the category', async function (this: ExpenseTrackerWorld, _step: string) {
  await this.app.iconChoices.first().click();
});

Then(
  '{string} See the {string}',
  async function (this: ExpenseTrackerWorld, _step: string, target: string) {
    await expect(this.app.screen(target)).toBeVisible();
  }
);

Then(
  '{string} See {string} in the {string}',
  async function (this: ExpenseTrackerWorld, _step: string, expectedText: string, target: string) {
    if (target === 'theme attribute') {
      const theme = await this.page.locator('html').getAttribute('data-theme');
      expect(theme).toBe(expectedText);
      return;
    }
    await expect(this.app.screen(target)).toContainText(expectedText);
  }
);
