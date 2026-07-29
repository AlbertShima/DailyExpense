// ---- Translations ----
const I18N = {
  en: {
    'login.title': "Who's tracking expenses?",
    'login.createNew': '+ Create new profile',
    'login.namePlaceholder': 'Your name',
    'login.passcodeOptional': 'Passcode (optional)',
    'login.start': 'START',
    'login.enterPasscodeTitle': 'Enter passcode',
    'login.passcodePlaceholder': 'Passcode',
    'login.wrongPasscode': 'Incorrect passcode',
    'login.nameRequired': 'Please enter a name',

    'common.ok': 'OK',

    'overview.monthly': 'Monthly View',
    'overview.yearly': 'Yearly View',
    'overview.calendar': 'Calendar Daily View',

    'total.month': 'Total spent this month',
    'total.year': 'Total spent this year',
    'total.day': 'Total spent on {date}',

    'empty.month': 'No expenses recorded for this month.',
    'empty.day': 'No expenses on this day.',
    'allExpensesIn': 'All expenses in {month}',

    'modal.addTitle': 'Add Expense',
    'modal.editTitle': 'Edit Expense',

    'field.category': 'Category',
    'field.amount': 'Amount',
    'field.note': 'Note',
    'field.date': 'Date',
    'field.selectCategory': 'Select category',
    'field.notePlaceholder': 'Add a note (optional)',

    'btn.save': 'SAVE',
    'btn.saveCategory': 'Save',
    'btn.delete': 'Delete',
    'btn.cancel': 'Cancel',

    'profile.title': 'Profile',
    'profile.savedProfiles': 'Saved profiles',
    'profile.newProfile': '+ New Profile',
    'profile.logout': 'Log Out',
    'profile.active': 'Active',

    'categoryManager.title': 'Manage Categories',
    'categoryManager.addNew': '+ Add category',
    'categoryManager.namePlaceholder': 'Category name',
    'categoryManager.deleteConfirm': 'Delete this category? Expenses in it will move to "Other".',
    'categoryManager.nameRequired': 'Please enter a name and pick an icon',

    'category.food': 'Food & Drink',
    'category.transport': 'Transport',
    'category.groceries': 'Groceries',
    'category.shopping': 'Shopping',
    'category.bills': 'Bills & Utilities',
    'category.entertainment': 'Entertainment',
    'category.health': 'Health',
    'category.education': 'Education',
    'category.travel': 'Travel',
    'category.other': 'Other',

    months: ['January','February','March','April','May','June','July','August','September','October','November','December'],
    monthsShort: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
    dowShort: ['S','M','T','W','T','F','S'],
    dowMed: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
  },

  sq: {
    'login.title': 'Kush po ndjek shpenzimet?',
    'login.createNew': '+ Krijo profil të ri',
    'login.namePlaceholder': 'Emri yt',
    'login.passcodeOptional': 'Kod kalimi (opsional)',
    'login.start': 'FILLO',
    'login.enterPasscodeTitle': 'Shkruaj kodin',
    'login.passcodePlaceholder': 'Kodi',
    'login.wrongPasscode': 'Kod i pasaktë',
    'login.nameRequired': 'Ju lutem shkruani një emër',

    'common.ok': 'OK',

    'overview.monthly': 'Pamja Mujore',
    'overview.yearly': 'Pamja Vjetore',
    'overview.calendar': 'Pamja Ditore (Kalendar)',

    'total.month': 'Shpenzim total këtë muaj',
    'total.year': 'Shpenzim total këtë vit',
    'total.day': 'Shpenzim total më {date}',

    'empty.month': "S'ka shpenzime të regjistruara për këtë muaj.",
    'empty.day': "S'ka shpenzime këtë ditë.",
    'allExpensesIn': 'Të gjitha shpenzimet në {month}',

    'modal.addTitle': 'Shto Shpenzim',
    'modal.editTitle': 'Redakto Shpenzimin',

    'field.category': 'Kategoria',
    'field.amount': 'Shuma',
    'field.note': 'Shënim',
    'field.date': 'Data',
    'field.selectCategory': 'Zgjidh kategorinë',
    'field.notePlaceholder': 'Shto një shënim (opsionale)',

    'btn.save': 'RUAJ',
    'btn.saveCategory': 'Ruaj',
    'btn.delete': 'Fshi',
    'btn.cancel': 'Anulo',

    'profile.title': 'Profili',
    'profile.savedProfiles': 'Profilet e ruajtura',
    'profile.newProfile': '+ Profil i Ri',
    'profile.logout': 'Dil',
    'profile.active': 'Aktiv',

    'categoryManager.title': 'Menaxho Kategoritë',
    'categoryManager.addNew': '+ Shto kategori',
    'categoryManager.namePlaceholder': 'Emri i kategorisë',
    'categoryManager.deleteConfirm': 'Fshi këtë kategori? Shpenzimet në të do të kalojnë te "Tjetër".',
    'categoryManager.nameRequired': 'Ju lutem shkruani një emër dhe zgjidhni një ikonë',

    'category.food': 'Ushqim & Pije',
    'category.transport': 'Transporti',
    'category.groceries': 'Ushqime (Market)',
    'category.shopping': 'Pazar',
    'category.bills': 'Fatura & Shërbime',
    'category.entertainment': 'Argëtim',
    'category.health': 'Shëndeti',
    'category.education': 'Edukimi',
    'category.travel': 'Udhëtim',
    'category.other': 'Tjetër',

    months: ['Janar','Shkurt','Mars','Prill','Maj','Qershor','Korrik','Gusht','Shtator','Tetor','Nëntor','Dhjetor'],
    monthsShort: ['Jan','Shk','Mar','Pri','Maj','Qer','Kor','Gus','Sht','Tet','Nën','Dhj'],
    dowShort: ['Di','Hë','Ma','Më','En','Pr','Sh'],
    dowMed: ['Die','Hën','Mar','Mër','Enj','Pre','Sht'],
  }
};

const LANG_STORAGE_KEY = 'etLang';
let currentLang = localStorage.getItem(LANG_STORAGE_KEY) || 'en';

function t(key, vars) {
  let str = (I18N[currentLang] && I18N[currentLang][key]) || I18N.en[key] || key;
  if (vars) {
    Object.keys(vars).forEach(k => { str = str.replace(`{${k}}`, vars[k]); });
  }
  return str;
}

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem(LANG_STORAGE_KEY, lang);
}

function applyStaticTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder')));
  });
}
