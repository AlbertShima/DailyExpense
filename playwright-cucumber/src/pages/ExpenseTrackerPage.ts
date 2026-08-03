import { Locator, Page } from 'playwright';

/**
 * Page Object for the Expense Tracker app.
 * Holds only the locators that the test suite actually exercises —
 * not a 1:1 mirror of every element in index.html.
 */
export class ExpenseTrackerPage {
  // Login / profile-select screen
  readonly newProfileNameInput: Locator;
  readonly newProfilePasscodeInput: Locator;
  readonly startBtn: Locator;
  readonly showNewProfileBtn: Locator;

  // Top bar
  readonly themeToggleBtn: Locator;
  readonly langToggleBtn: Locator;
  readonly profileBtn: Locator;
  readonly totalAmount: Locator;

  // Add / edit expense modal
  readonly fabAddBtn: Locator;
  readonly categorySelect: Locator;
  readonly amountInput: Locator;
  readonly noteInput: Locator;
  readonly dateInput: Locator;
  readonly saveExpenseBtn: Locator;
  readonly deleteBtn: Locator;
  readonly closeModalBtn: Locator;

  // Category manager modal
  readonly categorySettingsBtn: Locator;
  readonly addCategoryBtn: Locator;
  readonly categoryNameInput: Locator;
  readonly categorySaveBtn: Locator;
  readonly categoryManagerList: Locator;
  readonly iconChoices: Locator;

  // Generic containers used for assertions
  readonly appRoot: Locator;
  readonly viewContent: Locator;
  readonly modalOverlay: Locator;
  readonly categoryManagerOverlay: Locator;
  readonly expenseItems: Locator;

  constructor(private readonly page: Page) {
    this.newProfileNameInput = page.locator('#newProfileName');
    this.newProfilePasscodeInput = page.locator('#newProfilePasscode');
    this.startBtn = page.locator('#createProfileBtn');
    this.showNewProfileBtn = page.locator('#showNewProfileBtn');

    this.themeToggleBtn = page.locator('#themeToggle');
    this.langToggleBtn = page.locator('#langToggle');
    this.profileBtn = page.locator('#profileBtn');
    this.totalAmount = page.locator('#totalAmount');

    this.fabAddBtn = page.locator('#fabAdd');
    this.categorySelect = page.locator('#categorySelect');
    this.amountInput = page.locator('#amountInput');
    this.noteInput = page.locator('#noteInput');
    this.dateInput = page.locator('#dateInput');
    this.saveExpenseBtn = page.locator('#saveExpenseBtn');
    this.deleteBtn = page.locator('#deleteBtn');
    this.closeModalBtn = page.locator('#closeModal');

    this.categorySettingsBtn = page.locator('#categorySettingsBtn');
    this.addCategoryBtn = page.locator('#addCategoryBtn');
    this.categoryNameInput = page.locator('#categoryNameInput');
    this.categorySaveBtn = page.locator('#categorySaveBtn');
    this.categoryManagerList = page.locator('#categoryManagerList');
    this.iconChoices = page.locator('#iconGrid .icon-choice');

    this.appRoot = page.locator('#appRoot');
    this.viewContent = page.locator('#viewContent');
    this.modalOverlay = page.locator('#modalOverlay');
    this.categoryManagerOverlay = page.locator('#categoryManagerOverlay');
    this.expenseItems = page.locator('.expense-item');
  }

  /** Maps the human-readable button names used in the .feature file to a locator. */
  button(name: string): Locator {
    const map: Record<string, Locator> = {
      start: this.startBtn,
      'create new profile': this.showNewProfileBtn,
      'add expense': this.fabAddBtn,
      save: this.saveExpenseBtn,
      delete: this.deleteBtn,
      'close modal': this.closeModalBtn,
      'theme toggle': this.themeToggleBtn,
      'language toggle': this.langToggleBtn,
      profile: this.profileBtn,
      'manage categories': this.categorySettingsBtn,
      'add category': this.addCategoryBtn,
      'save category': this.categorySaveBtn,
    };
    const locator = map[name.toLowerCase()];
    if (!locator) {
      throw new Error(`No locator mapped for button "${name}"`);
    }
    return locator;
  }

  /** Maps the human-readable screen/element names used in .feature assertions to a locator. */
  screen(name: string): Locator {
    const map: Record<string, Locator> = {
      'expense tracker main screen': this.appRoot,
      'add expense modal': this.modalOverlay,
      'category manager modal': this.categoryManagerOverlay,
      'category manager list': this.categoryManagerList,
      'total amount': this.totalAmount,
      'language toggle': this.langToggleBtn,
    };
    const locator = map[name.toLowerCase()];
    if (!locator) {
      throw new Error(`No locator mapped for screen/element "${name}"`);
    }
    return locator;
  }

  /** Maps the human-readable field names used in the .feature file to a locator. */
  field(name: string): Locator {
    const map: Record<string, Locator> = {
      'profile name': this.newProfileNameInput,
      passcode: this.newProfilePasscodeInput,
      amount: this.amountInput,
      note: this.noteInput,
      date: this.dateInput,
      'category name': this.categoryNameInput,
    };
    const locator = map[name.toLowerCase()];
    if (!locator) {
      throw new Error(`No locator mapped for field "${name}"`);
    }
    return locator;
  }
}
