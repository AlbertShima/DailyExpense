import { setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber';
import { BrowserContext, Page } from 'playwright';
import { ExpenseTrackerPage } from '../pages/ExpenseTrackerPage';

export class ExpenseTrackerWorld extends World {
  context!: BrowserContext;
  page!: Page;
  app!: ExpenseTrackerPage;

  constructor(options: IWorldOptions) {
    super(options);
  }
}

setWorldConstructor(ExpenseTrackerWorld);
