// ---- Storage keys ----
const THEME_KEY = 'etTheme';
const PROFILES_KEY = 'etProfiles';
const ACTIVE_PROFILE_KEY = 'etActiveProfile';
const LEGACY_DATA_KEY = 'expenseTrackerData';

const ICON_CHOICES = [
  '🍔','🚗','🛒','🛍️','🧾','🎬','💊','📚','✈️','🔖',
  '🏠','💡','📱','🎮','🐾','💼','🎁','⚽','🍺','☕',
  '🚕','🏥','🎓','🛠️','📷','🎵','🐶','🌳','💳','🧴',
];

// ---- State ----
let profiles = [];
let activeProfileId = null;
let categories = [];
let expenses = [];
let currentView = 'monthly';
let refDate = new Date();
let selectedDay = null;
let selectedIcon = null;
let pendingPasscode = null; // { profileId, mode: 'login' | 'switch' }

// ---- Helpers ----
function pad2(n) { return String(n).padStart(2, '0'); }

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function formatCurrency(amount) {
  return '$' + Number(amount).toFixed(2);
}

function sumAmounts(list) {
  return list.reduce((sum, e) => sum + Number(e.amount), 0);
}

function generateId(prefix) {
  return (prefix || 'id') + Date.now() + Math.random().toString(36).slice(2, 8);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatDateReadable(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const dow = new Date(y, m - 1, d).getDay();
  const months = I18N[currentLang].monthsShort;
  return `${I18N[currentLang].dowMed[dow]} ${d} ${months[m - 1]}`;
}

// ---- Theme ----
function loadTheme() { return localStorage.getItem(THEME_KEY) || 'light'; }

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
  const icon = document.getElementById('themeIcon');
  icon.textContent = theme === 'light' ? '🌙' : '☀️';
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  applyTheme(current === 'light' ? 'dark' : 'light');
}

// ---- Language ----
function toggleLang() {
  setLang(currentLang === 'en' ? 'sq' : 'en');
  document.getElementById('langToggle').textContent = currentLang === 'en' ? 'EN' : 'ALB';
  applyStaticTranslations();
  if (!document.getElementById('loginScreen').classList.contains('hidden')) {
    renderLoginScreen();
  }
  if (activeProfileId) {
    populateCategorySelect();
    render();
  }
}

// ---- Profiles ----
function loadProfiles() {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveProfiles() {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

function expensesKey(id) { return `etExpenses_${id}`; }
function categoriesKey(id) { return `etCategories_${id}`; }

function defaultCategories() {
  return [
    { id: 'food', icon: '🍔', label: t('category.food') },
    { id: 'transport', icon: '🚗', label: t('category.transport') },
    { id: 'groceries', icon: '🛒', label: t('category.groceries') },
    { id: 'shopping', icon: '🛍️', label: t('category.shopping') },
    { id: 'bills', icon: '🧾', label: t('category.bills') },
    { id: 'entertainment', icon: '🎬', label: t('category.entertainment') },
    { id: 'health', icon: '💊', label: t('category.health') },
    { id: 'education', icon: '📚', label: t('category.education') },
    { id: 'travel', icon: '✈️', label: t('category.travel') },
    { id: 'other', icon: '🔖', label: t('category.other') },
  ];
}

function migrateLegacyDataIfNeeded() {
  const legacyRaw = localStorage.getItem(LEGACY_DATA_KEY);
  if (legacyRaw && profiles.length === 0) {
    const id = 'default';
    const profile = { id, name: 'Albert', passcode: '', createdAt: Date.now() };
    profiles = [profile];
    saveProfiles();
    localStorage.setItem(expensesKey(id), legacyRaw);
    localStorage.setItem(categoriesKey(id), JSON.stringify(defaultCategories()));
    localStorage.removeItem(LEGACY_DATA_KEY);
  }
}

function createProfile(name, passcode) {
  const id = generateId('p');
  const profile = { id, name, passcode: passcode || '', createdAt: Date.now() };
  profiles.push(profile);
  saveProfiles();
  localStorage.setItem(expensesKey(id), JSON.stringify([]));
  localStorage.setItem(categoriesKey(id), JSON.stringify(defaultCategories()));
  return profile;
}

function setActiveProfile(id) {
  activeProfileId = id;
  localStorage.setItem(ACTIVE_PROFILE_KEY, id);
  loadProfileData();
  currentView = 'monthly';
  refDate = new Date();
  selectedDay = null;
  showApp();
  populateCategorySelect();
  render();
}

function logout() {
  activeProfileId = null;
  localStorage.removeItem(ACTIVE_PROFILE_KEY);
  showLogin();
}

function loadProfileData() {
  try {
    expenses = JSON.parse(localStorage.getItem(expensesKey(activeProfileId)) || '[]');
  } catch (e) { expenses = []; }
  try {
    categories = JSON.parse(localStorage.getItem(categoriesKey(activeProfileId)) || '[]');
  } catch (e) { categories = []; }
  if (categories.length === 0) {
    categories = defaultCategories();
    saveCategories();
  }
}

function saveExpenses() {
  localStorage.setItem(expensesKey(activeProfileId), JSON.stringify(expenses));
}

function saveCategories() {
  localStorage.setItem(categoriesKey(activeProfileId), JSON.stringify(categories));
}

function categoryInfo(id) {
  return categories.find(c => c.id === id) || { label: id, icon: '🔖' };
}

// ---- Screen switching ----
function showLogin() {
  document.getElementById('appRoot').classList.add('hidden');
  document.getElementById('loginScreen').classList.remove('hidden');
  renderLoginScreen();
}

function showApp() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('appRoot').classList.remove('hidden');
  const profile = profiles.find(p => p.id === activeProfileId);
  const initial = profile ? profile.name.trim().charAt(0).toUpperCase() : '?';
  document.getElementById('profileInitial').textContent = initial || '?';
}

// ---- Login screen rendering ----
function renderLoginScreen() {
  const list = document.getElementById('profileList');
  list.innerHTML = '';
  profiles.forEach(p => {
    const row = document.createElement('div');
    row.className = 'profile-row';
    row.innerHTML = `
      <span class="profile-avatar">${escapeHtml(p.name.trim().charAt(0).toUpperCase() || '?')}</span>
      <span class="profile-row-name">${escapeHtml(p.name)}</span>
      <span class="profile-row-arrow">›</span>
    `;
    row.addEventListener('click', () => attemptLogin(p.id));
    list.appendChild(row);
  });
  document.getElementById('newProfileForm').classList.add('hidden');
  document.getElementById('newProfileName').value = '';
  document.getElementById('newProfilePasscode').value = '';
}

function attemptLogin(profileId) {
  const profile = profiles.find(p => p.id === profileId);
  if (!profile) return;
  if (profile.passcode) {
    openPasscodePrompt(profileId, 'login');
  } else {
    setActiveProfile(profileId);
  }
}

// ---- Passcode overlay ----
function openPasscodePrompt(profileId, mode) {
  pendingPasscode = { profileId, mode };
  document.getElementById('passcodeInput').value = '';
  document.getElementById('passcodeError').classList.add('hidden');
  document.getElementById('passcodeOverlay').classList.remove('hidden');
  document.getElementById('passcodeInput').focus();
}

function closePasscodePrompt() {
  pendingPasscode = null;
  document.getElementById('passcodeOverlay').classList.add('hidden');
}

function submitPasscode() {
  if (!pendingPasscode) return;
  const profile = profiles.find(p => p.id === pendingPasscode.profileId);
  const entered = document.getElementById('passcodeInput').value;
  if (!profile || entered !== profile.passcode) {
    document.getElementById('passcodeError').textContent = t('login.wrongPasscode');
    document.getElementById('passcodeError').classList.remove('hidden');
    return;
  }
  const profileId = pendingPasscode.profileId;
  closePasscodePrompt();
  setActiveProfile(profileId);
  document.getElementById('profileOverlay').classList.add('hidden');
}

// ---- Profile view (while logged in) ----
function openProfileView() {
  const profile = profiles.find(p => p.id === activeProfileId);
  document.getElementById('profileAvatarInitial').textContent = profile ? profile.name.trim().charAt(0).toUpperCase() : '?';
  document.getElementById('currentProfileName').textContent = profile ? profile.name : '';

  const list = document.getElementById('profileSwitchList');
  list.innerHTML = '';
  profiles.filter(p => p.id !== activeProfileId).forEach(p => {
    const row = document.createElement('div');
    row.className = 'profile-row';
    row.innerHTML = `
      <span class="profile-avatar">${escapeHtml(p.name.trim().charAt(0).toUpperCase() || '?')}</span>
      <span class="profile-row-name">${escapeHtml(p.name)}</span>
      <span class="profile-row-arrow">›</span>
    `;
    row.addEventListener('click', () => {
      if (p.passcode) {
        openPasscodePrompt(p.id, 'switch');
      } else {
        setActiveProfile(p.id);
        document.getElementById('profileOverlay').classList.add('hidden');
      }
    });
    list.appendChild(row);
  });

  document.getElementById('profileOverlay').classList.remove('hidden');
}

// ---- Category select population ----
function populateCategorySelect() {
  const select = document.getElementById('categorySelect');
  const prevValue = select.value;
  select.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.disabled = true;
  placeholder.textContent = t('field.selectCategory');
  select.appendChild(placeholder);
  categories.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = `${c.icon} ${c.label}`;
    select.appendChild(opt);
  });
  if (categories.some(c => c.id === prevValue)) {
    select.value = prevValue;
  } else {
    placeholder.selected = true;
  }
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

const VIEW_LABEL_KEYS = { monthly: 'overview.monthly', yearly: 'overview.yearly', calendar: 'overview.calendar' };

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

// ---- Theme / Lang / Profile buttons ----
document.getElementById('themeToggle').addEventListener('click', toggleTheme);
document.getElementById('langToggle').addEventListener('click', toggleLang);
document.getElementById('profileBtn').addEventListener('click', openProfileView);
document.getElementById('closeProfileBtn').addEventListener('click', () => {
  document.getElementById('profileOverlay').classList.add('hidden');
});
document.getElementById('profileLogoutBtn').addEventListener('click', () => {
  document.getElementById('profileOverlay').classList.add('hidden');
  logout();
});
document.getElementById('profileNewBtn').addEventListener('click', () => {
  document.getElementById('profileOverlay').classList.add('hidden');
  logout();
  document.getElementById('showNewProfileBtn').click();
});

// ---- Login screen events ----
document.getElementById('showNewProfileBtn').addEventListener('click', () => {
  document.getElementById('newProfileForm').classList.remove('hidden');
  document.getElementById('newProfileName').focus();
});

document.getElementById('createProfileBtn').addEventListener('click', () => {
  const name = document.getElementById('newProfileName').value.trim();
  if (!name) {
    alert(t('login.nameRequired'));
    return;
  }
  const passcode = document.getElementById('newProfilePasscode').value;
  const profile = createProfile(name, passcode);
  setActiveProfile(profile.id);
});

// ---- Passcode overlay events ----
document.getElementById('closePasscodeBtn').addEventListener('click', closePasscodePrompt);
document.getElementById('passcodeSubmitBtn').addEventListener('click', submitPasscode);
document.getElementById('passcodeInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') submitPasscode();
});

// ---- Category manager ----
function openCategoryManager() {
  renderCategoryManagerList();
  document.getElementById('categoryEditForm').classList.add('hidden');
  document.getElementById('categoryManagerOverlay').classList.remove('hidden');
}

function renderCategoryManagerList() {
  const list = document.getElementById('categoryManagerList');
  list.innerHTML = '';
  categories.forEach(c => {
    const row = document.createElement('div');
    row.className = 'cat-manager-row';
    row.innerHTML = `
      <span class="expense-icon">${c.icon}</span>
      <span class="cat-manager-name">${escapeHtml(c.label)}</span>
      <button class="icon-only-btn" data-action="edit" aria-label="Edit">✏️</button>
      ${c.id === 'other' ? '' : '<button class="icon-only-btn" data-action="delete" aria-label="Delete">🗑️</button>'}
    `;
    row.querySelector('[data-action="edit"]').addEventListener('click', () => openCategoryEditForm(c));
    const delBtn = row.querySelector('[data-action="delete"]');
    if (delBtn) delBtn.addEventListener('click', () => deleteCategory(c.id));
    list.appendChild(row);
  });
}

function openCategoryEditForm(existing) {
  document.getElementById('categoryEditingId').value = existing ? existing.id : '';
  document.getElementById('categoryNameInput').value = existing ? existing.label : '';
  selectedIcon = existing ? existing.icon : null;
  renderIconGrid();
  document.getElementById('categoryEditForm').classList.remove('hidden');
}

function renderIconGrid() {
  const grid = document.getElementById('iconGrid');
  grid.innerHTML = '';
  ICON_CHOICES.forEach(icon => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'icon-choice' + (icon === selectedIcon ? ' selected' : '');
    btn.textContent = icon;
    btn.addEventListener('click', () => {
      selectedIcon = icon;
      grid.querySelectorAll('.icon-choice').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
    grid.appendChild(btn);
  });
}

function deleteCategory(id) {
  if (id === 'other') return;
  if (!confirm(t('categoryManager.deleteConfirm'))) return;
  expenses.forEach(e => { if (e.category === id) e.category = 'other'; });
  saveExpenses();
  categories = categories.filter(c => c.id !== id);
  saveCategories();
  renderCategoryManagerList();
  populateCategorySelect();
  render();
}

document.getElementById('categorySettingsBtn').addEventListener('click', openCategoryManager);
document.getElementById('closeCatManagerBtn').addEventListener('click', () => {
  document.getElementById('categoryManagerOverlay').classList.add('hidden');
});
document.getElementById('addCategoryBtn').addEventListener('click', () => openCategoryEditForm(null));
document.getElementById('categoryCancelBtn').addEventListener('click', () => {
  document.getElementById('categoryEditForm').classList.add('hidden');
});
document.getElementById('categorySaveBtn').addEventListener('click', () => {
  const name = document.getElementById('categoryNameInput').value.trim();
  if (!name || !selectedIcon) {
    alert(t('categoryManager.nameRequired'));
    return;
  }
  const editingId = document.getElementById('categoryEditingId').value;
  if (editingId) {
    const cat = categories.find(c => c.id === editingId);
    if (cat) { cat.label = name; cat.icon = selectedIcon; }
  } else {
    categories.push({ id: generateId('c'), icon: selectedIcon, label: name });
  }
  saveCategories();
  document.getElementById('categoryEditForm').classList.add('hidden');
  renderCategoryManagerList();
  populateCategorySelect();
  render();
});

// ---- Add/Edit expense modal ----
function openAddModal(prefillDate) {
  modalTitle.textContent = t('modal.addTitle');
  editingIdInput.value = '';
  categorySelect.value = '';
  amountInput.value = '';
  noteInput.value = '';
  dateInput.value = prefillDate || todayISO();
  deleteBtn.classList.add('hidden');
  modalOverlay.classList.remove('hidden');
}

function openEditModal(exp) {
  modalTitle.textContent = t('modal.editTitle');
  editingIdInput.value = exp.id;
  categorySelect.value = exp.category;
  amountInput.value = exp.amount;
  noteInput.value = exp.note || '';
  dateInput.value = exp.date;
  deleteBtn.classList.remove('hidden');
  modalOverlay.classList.remove('hidden');
}

function closeModal() { modalOverlay.classList.add('hidden'); }

fabAdd.addEventListener('click', () => {
  const prefill = currentView === 'calendar' && selectedDay ? selectedDay : null;
  openAddModal(prefill);
});

closeModalBtn.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });

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
    expenses.push({ id: generateId('e'), createdAt: Date.now(), ...data });
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
  overviewLabel.textContent = t(VIEW_LABEL_KEYS[currentView]);
  overviewMenu.querySelectorAll('button[data-view]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === currentView);
  });

  if (currentView === 'monthly') renderMonthly();
  else if (currentView === 'yearly') renderYearly();
  else renderCalendar();
}

function expensesForYearMonth(year, monthIndex) {
  const prefix = `${year}-${pad2(monthIndex + 1)}`;
  return expenses.filter(e => e.date.startsWith(prefix));
}
function expensesForYear(year) {
  const prefix = `${year}-`;
  return expenses.filter(e => e.date.startsWith(prefix));
}
function expensesForDay(iso) { return expenses.filter(e => e.date === iso); }

function buildExpenseItem(exp) {
  const info = categoryInfo(exp.category);
  const item = document.createElement('div');
  item.className = 'expense-item';
  item.innerHTML = `
    <div class="expense-icon">${info.icon}</div>
    <div class="expense-main">
      <div class="expense-category">${escapeHtml(info.label)}</div>
      ${exp.note ? `<div class="expense-note">${escapeHtml(exp.note)}</div>` : ''}
    </div>
    <div class="expense-amount">${formatCurrency(exp.amount)}</div>
  `;
  item.addEventListener('click', () => openEditModal(exp));
  return item;
}

function renderMonthly() {
  const year = refDate.getFullYear();
  const month = refDate.getMonth();
  periodLabel.textContent = `${I18N[currentLang].months[month]} ${year}`;

  const list = expensesForYearMonth(year, month);
  totalCaption.textContent = t('total.month');
  totalAmountEl.textContent = formatCurrency(sumAmounts(list));

  viewContent.innerHTML = '';
  if (list.length === 0) {
    viewContent.innerHTML = `<div class="empty-state">${t('empty.month')}</div>`;
    return;
  }

  const byDay = {};
  list.forEach(e => { (byDay[e.date] = byDay[e.date] || []).push(e); });
  const sortedDays = Object.keys(byDay).sort((a, b) => b.localeCompare(a));

  sortedDays.forEach(day => {
    const group = document.createElement('div');
    group.className = 'day-group';
    const header = document.createElement('div');
    header.className = 'day-group-header';
    header.textContent = `${formatDateReadable(day)} · ${formatCurrency(sumAmounts(byDay[day]))}`;
    group.appendChild(header);
    byDay[day].slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .forEach(exp => group.appendChild(buildExpenseItem(exp)));
    viewContent.appendChild(group);
  });
}

function renderYearly() {
  const year = refDate.getFullYear();
  periodLabel.textContent = `${year}`;

  const list = expensesForYear(year);
  totalCaption.textContent = t('total.year');
  totalAmountEl.textContent = formatCurrency(sumAmounts(list));

  viewContent.innerHTML = '';
  I18N[currentLang].months.forEach((name, idx) => {
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
  periodLabel.textContent = `${I18N[currentLang].months[month]} ${year}`;

  const monthList = expensesForYearMonth(year, month);

  if (selectedDay && selectedDay.startsWith(`${year}-${pad2(month + 1)}`)) {
    totalCaption.textContent = t('total.day', { date: formatDateReadable(selectedDay) });
    totalAmountEl.textContent = formatCurrency(sumAmounts(expensesForDay(selectedDay)));
  } else {
    selectedDay = null;
    totalCaption.textContent = t('total.month');
    totalAmountEl.textContent = formatCurrency(sumAmounts(monthList));
  }

  viewContent.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'calendar-grid';

  I18N[currentLang].dowShort.forEach(d => {
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
    : t('allExpensesIn', { month: I18N[currentLang].months[month] });
  viewContent.appendChild(listHeader);

  if (dayList.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = selectedDay ? t('empty.day') : t('empty.month');
    viewContent.appendChild(empty);
  } else {
    dayList.slice().sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt || 0) - (a.createdAt || 0))
      .forEach(exp => viewContent.appendChild(buildExpenseItem(exp)));
  }
}

// ---- Boot ----
applyTheme(loadTheme());
document.getElementById('langToggle').textContent = currentLang === 'en' ? 'EN' : 'ALB';
applyStaticTranslations();

profiles = loadProfiles();
migrateLegacyDataIfNeeded();

const savedActiveId = localStorage.getItem(ACTIVE_PROFILE_KEY);
if (savedActiveId && profiles.some(p => p.id === savedActiveId)) {
  activeProfileId = savedActiveId;
  loadProfileData();
  showApp();
  populateCategorySelect();
  render();
} else {
  showLogin();
}
