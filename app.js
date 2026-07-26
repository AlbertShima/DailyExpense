// ---- Config ----
const STORAGE_KEY = 'expenseTrackerData';

const CATEGORIES = [
  { id: 'food', label: 'Food & Drink', icon: '🍔' },
  { id: 'transport', label: 'Transport', icon: '🚗' },
  { id: 'groceries', label: 'Groceries', icon: '🛒' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️' },
  { id: 'bills', label: 'Bills & Utilities', icon: '🧾' },
  { id: 'entertainment', label: 'Entertainment', icon: '🎬' },
  { id: 'health', label: 'Health', icon: '💊' },
  { id: 'education', label: 'Education', icon: '📚' },
  { id: 'travel', label: 'Travel', icon: '✈️' },
  { id: 'other', label: 'Other', icon: '🔖' },
];

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DOW_NAMES = ['S','M','T','W','T','F','S'];

// ---- State ----
let expenses = loadExpenses();
let currentView = 'monthly'; // 'monthly' | 'yearly' | 'calendar'
let refDate = new Date(); // reference point for period navigation
let selectedDay = null; // ISO yyyy-mm-dd, used in calendar view

// ---- Storage ----
function loadExpenses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to load expenses', e);
    return [];
  }
}

function saveExpenses() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

// ---- Helpers ----
function pad2(n) { return String(n).padStart(2, '0'); }

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function formatCurrency(amount) {
  return '$' + Number(amount).toFixed(2);
}

function categoryInfo(id) {
  return CATEGORIES.find(c => c.id === id) || { label: id, icon: '🔖' };
}

function formatDateReadable(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function sumAmounts(list) {
  return list.reduce((sum, e) => sum + Number(e.amount), 0);
}

function expensesForYearMonth(year, monthIndex) {
  const prefix = `${year}-${pad2(monthIndex + 1)}`;
  return expenses.filter(e => e.date.startsWith(prefix));
}

function expensesForYear(year) {
  const prefix = `${year}-`;
  return expenses.filter(e => e.date.startsWith(prefix));
}

function expensesForDay(iso) {
  return expenses.filter(e => e.date === iso);
}

function generateId() {
  return 'e' + Date.now() + Math.random().toString(36).slice(2, 8);
}

// ---- DOM refs ----
const overviewBtn = document.getElementById('overviewBtn');
const overviewLabel = document.getElementById('overviewLabel');
const overviewMenu = document.getElementById('overviewMenu');
const periodLabel = document.getElementById('periodLabel');
const prevPeriodBtn = document.getElementById('prevPeriod');
const nextPeriodBtn = document.getElementById('nextPeriod');
const totalCaption = document.getElementById('totalCaption');
const totalAmountEl = document.getElementById('totalAmount');
const viewContent = document.getElementById('viewContent');
const fabAdd = document.getElementById('fabAdd');
const modalOverlay = document.getElementById('modalOverlay');
const modalTitle = document.getElementById('modalTitle');
const closeModalBtn = document.getElementById('closeModal');
const expenseForm = document.getElementById('expenseForm');
const categorySelect = document.getElementById('categorySelect');
const amountInput = document.getElementById('amountInput');
const noteInput = document.getElementById('noteInput');
const dateInput = document.getElementById('dateInput');
const editingIdInput = document.getElementById('editingId');
const deleteBtn = document.getElementById('deleteBtn');

const VIEW_LABELS = { monthly: 'Monthly View', yearly: 'Yearly View', calendar: 'Calendar Daily View' };

// ---- Init categories in select ----
CATEGORIES.forEach(c => {
  const opt = document.createElement('option');
  opt.value = c.id;
  opt.textContent = `${c.icon} ${c.label}`;
  categorySelect.appendChild(opt);
});

// ---- Overview dropdown ----
overviewBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  overviewMenu.classList.toggle('hidden');
});

document.addEventListener('click', () => overviewMenu.classList.add('hidden'));

overviewMenu.querySelectorAll('button[data-view]').forEach(btn => {
  btn.addEventListener('click', () => {
    currentView = btn.dataset.view;
    selectedDay = null;
    overviewMenu.classList.add('hidden');
    render();
  });
});

// ---- Period navigation ----
prevPeriodBtn.addEventListener('click', () => {
  if (currentView === 'yearly') {
    refDate = new Date(refDate.getFullYear() - 1, refDate.getMonth(), 1);
  } else {
    refDate = new Date(refDate.getFullYear(), refDate.getMonth() - 1, 1);
  }
  selectedDay = null;
  render();
});

nextPeriodBtn.addEventListener('click', () => {
  if (currentView === 'yearly') {
    refDate = new Date(refDate.getFullYear() + 1, refDate.getMonth(), 1);
  } else {
    refDate = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 1);
  }
  selectedDay = null;
  render();
});

// ---- Modal open/close ----
function openAddModal(prefillDate) {
  modalTitle.textContent = 'Add Expense';
  editingIdInput.value = '';
  categorySelect.value = '';
  amountInput.value = '';
  noteInput.value = '';
  dateInput.value = prefillDate || todayISO();
  deleteBtn.classList.add('hidden');
  modalOverlay.classList.remove('hidden');
}

function openEditModal(expense) {
  modalTitle.textContent = 'Edit Expense';
  editingIdInput.value = expense.id;
  categorySelect.value = expense.category;
  amountInput.value = expense.amount;
  noteInput.value = expense.note || '';
  dateInput.value = expense.date;
  deleteBtn.classList.remove('hidden');
  modalOverlay.classList.remove('hidden');
}

function closeModal() {
  modalOverlay.classList.add('hidden');
}

fabAdd.addEventListener('click', () => {
  const prefill = currentView === 'calendar' && selectedDay ? selectedDay : null;
  openAddModal(prefill);
});

closeModalBtn.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});

expenseForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const id = editingIdInput.value;
  const data = {
    category: categorySelect.value,
    amount: parseFloat(amountInput.value),
    note: noteInput.value.trim(),
    date: dateInput.value,
  };

  if (!data.category || isNaN(data.amount) || !data.date) return;

  if (id) {
    const idx = expenses.findIndex(x => x.id === id);
    if (idx !== -1) expenses[idx] = { ...expenses[idx], ...data };
  } else {
    expenses.push({ id: generateId(), createdAt: Date.now(), ...data });
  }

  saveExpenses();
  closeModal();
  render();
});

deleteBtn.addEventListener('click', () => {
  const id = editingIdInput.value;
  if (!id) return;
  if (!confirm('Delete this expense?')) return;
  expenses = expenses.filter(x => x.id !== id);
  saveExpenses();
  closeModal();
  render();
});

// ---- Rendering ----
function render() {
  overviewLabel.textContent = VIEW_LABELS[currentView];
  overviewMenu.querySelectorAll('button[data-view]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === currentView);
  });

  if (currentView === 'monthly') renderMonthly();
  else if (currentView === 'yearly') renderYearly();
  else renderCalendar();
}

function renderMonthly() {
  const year = refDate.getFullYear();
  const month = refDate.getMonth();
  periodLabel.textContent = `${MONTH_NAMES[month]} ${year}`;

  const list = expensesForYearMonth(year, month);
  totalCaption.textContent = 'Total spent this month';
  totalAmountEl.textContent = formatCurrency(sumAmounts(list));

  viewContent.innerHTML = '';

  if (list.length === 0) {
    viewContent.innerHTML = '<div class="empty-state">No expenses recorded for this month.</div>';
    return;
  }

  const byDay = {};
  list.forEach(e => {
    (byDay[e.date] = byDay[e.date] || []).push(e);
  });

  const sortedDays = Object.keys(byDay).sort((a, b) => b.localeCompare(a));

  sortedDays.forEach(day => {
    const group = document.createElement('div');
    group.className = 'day-group';

    const header = document.createElement('div');
    header.className = 'day-group-header';
    header.textContent = `${formatDateReadable(day)} · ${formatCurrency(sumAmounts(byDay[day]))}`;
    group.appendChild(header);

    byDay[day]
      .slice()
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .forEach(exp => group.appendChild(buildExpenseItem(exp)));

    viewContent.appendChild(group);
  });
}

function buildExpenseItem(exp) {
  const info = categoryInfo(exp.category);
  const item = document.createElement('div');
  item.className = 'expense-item';
  item.innerHTML = `
    <div class="expense-icon">${info.icon}</div>
    <div class="expense-main">
      <div class="expense-category">${info.label}</div>
      ${exp.note ? `<div class="expense-note">${escapeHtml(exp.note)}</div>` : ''}
    </div>
    <div class="expense-amount">${formatCurrency(exp.amount)}</div>
  `;
  item.addEventListener('click', () => openEditModal(exp));
  return item;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderYearly() {
  const year = refDate.getFullYear();
  periodLabel.textContent = `${year}`;

  const list = expensesForYear(year);
  totalCaption.textContent = 'Total spent this year';
  totalAmountEl.textContent = formatCurrency(sumAmounts(list));

  viewContent.innerHTML = '';

  MONTH_NAMES.forEach((name, idx) => {
    const monthList = expensesForYearMonth(year, idx);
    const total = sumAmounts(monthList);

    const row = document.createElement('div');
    row.className = 'month-row';
    row.innerHTML = `
      <span class="month-name">${name}</span>
      <span class="month-total ${total === 0 ? 'zero' : ''}">${formatCurrency(total)}</span>
    `;
    row.addEventListener('click', () => {
      refDate = new Date(year, idx, 1);
      currentView = 'monthly';
      render();
    });
    viewContent.appendChild(row);
  });
}

function renderCalendar() {
  const year = refDate.getFullYear();
  const month = refDate.getMonth();
  periodLabel.textContent = `${MONTH_NAMES[month]} ${year}`;

  const monthList = expensesForYearMonth(year, month);

  if (selectedDay && selectedDay.startsWith(`${year}-${pad2(month + 1)}`)) {
    totalCaption.textContent = `Total spent on ${formatDateReadable(selectedDay)}`;
    totalAmountEl.textContent = formatCurrency(sumAmounts(expensesForDay(selectedDay)));
  } else {
    selectedDay = null;
    totalCaption.textContent = 'Total spent this month';
    totalAmountEl.textContent = formatCurrency(sumAmounts(monthList));
  }

  viewContent.innerHTML = '';

  const grid = document.createElement('div');
  grid.className = 'calendar-grid';

  DOW_NAMES.forEach(d => {
    const el = document.createElement('div');
    el.className = 'calendar-dow';
    el.textContent = d;
    grid.appendChild(el);
  });

  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayIso = todayISO();

  for (let i = 0; i < firstDow; i++) {
    const el = document.createElement('div');
    el.className = 'calendar-day empty';
    grid.appendChild(el);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const iso = `${year}-${pad2(month + 1)}-${pad2(day)}`;
    const dayExpenses = expensesForDay(iso);
    const total = sumAmounts(dayExpenses);

    const cell = document.createElement('div');
    cell.className = 'calendar-day';
    if (total > 0) cell.classList.add('has-expense');
    if (iso === todayIso) cell.classList.add('today');
    if (iso === selectedDay) cell.classList.add('selected');

    cell.innerHTML = `
      <span class="day-num">${day}</span>
      ${total > 0 ? `<span class="day-amt">${formatCurrency(total)}</span>` : ''}
    `;
    cell.addEventListener('click', () => {
      selectedDay = selectedDay === iso ? null : iso;
      renderCalendar();
    });
    grid.appendChild(cell);
  }

  viewContent.appendChild(grid);

  const dayList = selectedDay ? expensesForDay(selectedDay) : monthList;
  const listHeader = document.createElement('div');
  listHeader.className = 'day-list-header';
  listHeader.textContent = selectedDay
    ? formatDateReadable(selectedDay)
    : `All expenses in ${MONTH_NAMES[month]}`;
  viewContent.appendChild(listHeader);

  if (dayList.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = selectedDay ? 'No expenses on this day.' : 'No expenses recorded for this month.';
    viewContent.appendChild(empty);
  } else {
    dayList
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt || 0) - (a.createdAt || 0))
      .forEach(exp => viewContent.appendChild(buildExpenseItem(exp)));
  }
}

// ---- Boot ----
render();
