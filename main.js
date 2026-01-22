// ========================================
// КОНФИГУРАЦИЯ FIREBASE
// ========================================
// ЗАМЕНИТЕ ЭТИ ДАННЫЕ НА СВОИ ИЗ FIREBASE CONSOLE
const firebaseConfig = {
  apiKey: 'AIzaSyBfLRu69tYAPy9WeduJ6ZjYOzkGeRRNvEk',

  authDomain: 'hantar-d0668.firebaseapp.com',

  databaseURL: 'https://hantar-d0668-default-rtdb.firebaseio.com',

  projectId: 'hantar-d0668',

  storageBucket: 'hantar-d0668.firebasestorage.app',

  messagingSenderId: '562541350283',

  appId: '1:562541350283:web:7a39b0f2c9bc2577c3b38e',

  measurementId: 'G-F7BMKZC197',
};


// Init Firebase
let database;
let statusesRef;

try {
  firebase.initializeApp(firebaseConfig);
  database = firebase.database();
  statusesRef = database.ref('employeeStatuses');
  console.log('Firebase connected successfully!');
} catch (error) {
  console.error('Error while connecting to Firebase:', error);
  alert('Error while connection to firebase, please check the configuration.');
}

// Some config shit or whatever
const ADMIN_PASSWORD = 'admin123';

const employees = [
  'רומן רודוי',
  'אורי סהר',
  'מאיר סגל'
];

const statuses = [
  { id: 'not_departed', label: 'עדיין בבסיס', color: 'not-departed' },
  { id: 'on_road', label: 'בדרך', color: 'on-road' },
  { id: 'arrived', label: 'הגעתי הביתה', color: 'arrived' },
];

// Application state
let state = {
  isAdmin: false,
  selectedEmployee: '',
  selectedStatus: '',
  employeeStatuses: {},
};

// Page elements
const elements = {
  employeeForm: document.getElementById('employeeForm'),
  adminPanel: document.getElementById('adminPanel'),
  employeeSelect: document.getElementById('employeeSelect'),
  statusButtons: document.getElementById('statusButtons'),
  updateStatusBtn: document.getElementById('updateStatusBtn'),
  adminPassword: document.getElementById('adminPassword'),
  adminLoginBtn: document.getElementById('adminLoginBtn'),
  logoutBtn: document.getElementById('logoutBtn'),
  errorMsg: document.getElementById('errorMsg'),
  successMsg: document.getElementById('successMsg'),
  statsGrid: document.getElementById('statsGrid'),
  employeesList: document.getElementById('employeesList'),
  refreshBtn: document.getElementById('refreshBtn'),
};

// Initializing
function init() {
  renderEmployeeSelect();
  renderStatusButtons();
  setupEventListeners();
  setupFirebaseListener();
}

// * Firebase functions *

// Firebase Listener
function setupFirebaseListener() {
  statusesRef.on(
    'value',
    (snapshot) => {
      const data = snapshot.val();
      state.employeeStatuses = data || {};

      if (state.isAdmin) {
        renderAdminPanel();
      }

      console.log('Data is updated from Firebase');
    },
    (error) => {
      console.error('Error while reading data:', error);
    },
  );
}

// Status update in firebase
async function updateStatusInFirebase(employee, status) {
  try {
    await statusesRef.child(employee).set({
      status: status,
      timestamp: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error('Error while saving in Firebase:', error);
    throw error;
  }
}

// * Rendering functions *

// Soldier list
function renderEmployeeSelect() {
  employees.forEach((emp) => {
    const option = document.createElement('option');
    option.value = emp;
    option.textContent = emp;
    elements.employeeSelect.appendChild(option);
  });
}

// Status buttons
function renderStatusButtons() {
  statuses.forEach((status) => {
    const btn = document.createElement('button');
    btn.className = 'status-btn';
    btn.dataset.statusId = status.id;
    btn.innerHTML = `
            <div class="status-indicator ${status.color}"></div>
            <span class="status-label">${status.label}</span>
        `;
    btn.addEventListener('click', () => selectStatus(status.id));
    elements.statusButtons.appendChild(btn);
  });
}

// Admin panel
function renderAdminPanel() {
  renderStats();
  renderEmployeesList();
}

// Stats render
function renderStats() {
  const counts = getStatusCounts();
  elements.statsGrid.innerHTML = '';

  statuses.forEach((status) => {
    const count = counts[status.id] || 0;
    const card = document.createElement('div');
    card.className = 'stat-card';
    card.innerHTML = `
            <div class="stat-header">
                <div class="stat-indicator ${status.color}"></div>
                <span class="stat-label">${status.label}</span>
            </div>
            <div class="stat-count">${count}</div>
        `;
    elements.statsGrid.appendChild(card);
  });
}

// Soldiers list
function renderEmployeesList() {
  elements.employeesList.innerHTML = '';

  employees.forEach((emp) => {
    const empStatus = state.employeeStatuses[emp];
    const statusId = empStatus?.status;
    const timestamp = empStatus?.timestamp;

    const item = document.createElement('div');
    item.className = 'employee-item';

    const statusLabel = getStatusLabel(statusId);
    const statusColor = getStatusColor(statusId);
    const formattedTime = timestamp
      ? new Date(timestamp).toLocaleString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '';

    item.innerHTML = `
            <span class="employee-name">${emp}</span>
            <div class="employee-status-container">
                ${timestamp ? `<span class="employee-timestamp">${formattedTime}</span>` : ''}
                <span class="employee-status ${statusColor}">${statusLabel}</span>
            </div>
        `;
    elements.employeesList.appendChild(item);
  });
}

// * Event Listeners *

// Status select listener
function selectStatus(statusId) {
  state.selectedStatus = statusId;
  document.querySelectorAll('.status-btn').forEach((btn) => {
    btn.classList.toggle('selected', btn.dataset.statusId === statusId);
  });
}

// Listeners settings
function setupEventListeners() {
  elements.employeeSelect.addEventListener('change', (e) => {
    state.selectedEmployee = e.target.value;
  });

  elements.updateStatusBtn.addEventListener('click', updateStatus);
  elements.adminLoginBtn.addEventListener('click', handleAdminLogin);
  elements.logoutBtn.addEventListener('click', handleAdminLogout);
  elements.refreshBtn.addEventListener('click', () => {
    showSuccess('Data is updated automatically!');
  });

  elements.adminPassword.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleAdminLogin();
    }
  });
}

// Status update
async function updateStatus() {
  if (!state.selectedEmployee || !state.selectedStatus) {
    showError('בחר/י את השם שלך ואת המיקום שלך');
    return;
  }

  try {
    // Loading indicator
    elements.updateStatusBtn.disabled = true;
    elements.updateStatusBtn.textContent = 'שומר...';

    await updateStatusInFirebase(state.selectedEmployee, state.selectedStatus);

    // Сброс формы
    state.selectedEmployee = '';
    state.selectedStatus = '';
    elements.employeeSelect.value = '';
    document.querySelectorAll('.status-btn').forEach((btn) => {
      btn.classList.remove('selected');
    });

    showSuccess('תודה!');
  } catch (err) {
    showError(
      'Error while updating status, check your internet connection',
    );
  } finally {
    elements.updateStatusBtn.disabled = false;
    elements.updateStatusBtn.textContent = 'שמירה';
  }
}

// Admin panel enter
function handleAdminLogin() {
  const password = elements.adminPassword.value;
  if (password === ADMIN_PASSWORD) {
    state.isAdmin = true;
    showAdminPanel();
    renderAdminPanel();
    hideError();
  } else {
    showError('Wrong password');
  }
}

// Admin panel leave
function handleAdminLogout() {
  state.isAdmin = false;
  elements.adminPassword.value = '';
  showEmployeeForm();
}

// Show admin panel
function showAdminPanel() {
  elements.employeeForm.style.display = 'none';
  elements.adminPanel.style.display = 'flex';
  elements.logoutBtn.style.display = 'flex';
}

function showEmployeeForm() {
  elements.employeeForm.style.display = 'flex';
  elements.adminPanel.style.display = 'none';
  elements.logoutBtn.style.display = 'none';
}

/* Helper Functions */

// Get amount per status
function getStatusCounts() {
  const counts = {};
  statuses.forEach((s) => (counts[s.id] = 0));

  Object.values(state.employeeStatuses).forEach((status) => {
    if (status.status in counts) {
      counts[status.status]++;
    }
  });

  return counts;
}

// Show status label
function getStatusLabel(statusId) {
  return statuses.find((s) => s.id === statusId)?.label || 'לא ידוע';
}

// Get status color
function getStatusColor(statusId) {
  return statuses.find((s) => s.id === statusId)?.color || 'unknown';
}

function showError(message) {
  elements.errorMsg.textContent = message;
  elements.errorMsg.style.display = 'block';
  elements.successMsg.style.display = 'none';
}

function hideError() {
  elements.errorMsg.style.display = 'none';
}

function showSuccess(message) {
  elements.successMsg.textContent = message;
  elements.successMsg.style.display = 'block';
  elements.errorMsg.style.display = 'none';
  setTimeout(() => {
    elements.successMsg.style.display = 'none';
  }, 3000);
}

// Run app
document.addEventListener('DOMContentLoaded', init);
