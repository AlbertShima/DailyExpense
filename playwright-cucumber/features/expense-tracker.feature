Feature: Expense Tracker
  As a user of the Expense Tracker app
  I want to manage my profile, expenses and categories
  So that I can keep track of my personal spending

  # Every step starts with a plain-text traceability number ("1", "1.2", "1.3", ...).
  # It is NOT a Cucumber tag - it is just part of the step text - so when a
  # scenario fails you can tell exactly which numbered step broke, without
  # having to rely on the raw step text alone.

  Scenario: Create a new profile and log in
    Given "1" Open the expense tracker app
    When "1.2" Click on the button "create new profile"
    When "1.3" Fill the "profile name" field with "Albert"
    When "1.4" Click on the button "start"
    Then "1.5" See the "expense tracker main screen"

  Scenario: Add a new expense
    Given "2" Log in with a new profile named "Maria"
    When "2.2" Click on the button "add expense"
    When "2.3" Select "Food & Drink" from the "category" dropdown
    When "2.4" Fill the "amount" field with "45.50"
    When "2.5" Click on the button "save"
    Then "2.6" See "$45.50" in the "total amount"

  Scenario: Edit an existing expense
    Given "3" Log in with a new profile named "Diego"
    When "3.2" Click on the button "add expense"
    When "3.3" Select "Transport" from the "category" dropdown
    When "3.4" Fill the "amount" field with "10.00"
    When "3.5" Click on the button "save"
    When "3.6" Click on the first expense entry
    When "3.7" Fill the "amount" field with "25.00"
    When "3.8" Click on the button "save"
    Then "3.9" See "$25.00" in the "total amount"

  Scenario: Delete an expense
    Given "4" Log in with a new profile named "Sara"
    When "4.2" Click on the button "add expense"
    When "4.3" Select "Food & Drink" from the "category" dropdown
    When "4.4" Fill the "amount" field with "15.00"
    When "4.5" Click on the button "save"
    When "4.6" Click on the first expense entry
    When "4.7" Click on the button "delete"
    Then "4.8" See "$0.00" in the "total amount"

  Scenario: Toggle theme and language
    Given "5" Log in with a new profile named "Elena"
    When "5.2" Click on the button "theme toggle"
    Then "5.3" See "dark" in the "theme attribute"
    When "5.4" Click on the button "language toggle"
    Then "5.5" See "ALB" in the "language toggle"

  Scenario: Add a new expense category
    Given "6" Log in with a new profile named "Noah"
    When "6.2" Click on the button "add expense"
    When "6.3" Click on the button "manage categories"
    When "6.4" Click on the button "add category"
    When "6.5" Fill the "category name" field with "Pets"
    When "6.6" Pick the first icon for the category
    When "6.7" Click on the button "save category"
    Then "6.8" See "Pets" in the "category manager list"
