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


// Инициализация Firebase
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

// ========================================
// КОНФИГУРАЦИЯ ПРИЛОЖЕНИЯ
// ========================================
const ADMIN_PASSWORD = 'admin123';

const employees = [
  'Иван Петров',
  'Мария Сидорова',
  'Алексей Козлов',
  'Елена Новикова',
  'Дмитрий Волков',
  'Анна Морозова',
  'Сергей Лебедев',
  'Ольга Павлова',
];

const statuses = [
  { id: 'not_departed', label: 'עדיין בבסיס', color: 'not-departed' },
  { id: 'on_road', label: 'בדרך', color: 'on-road' },
  { id: 'arrived', label: 'הגעתי הביתה', color: 'arrived' },
];

// Состояние приложения
let state = {
  isAdmin: false,
  selectedEmployee: '',
  selectedStatus: '',
  employeeStatuses: {},
};

// Элементы DOM
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

// ========================================
// ИНИЦИАЛИЗАЦИЯ
// ========================================
function init() {
  renderEmployeeSelect();
  renderStatusButtons();
  setupEventListeners();
  setupFirebaseListener();
}

// ========================================
// FIREBASE ФУНКЦИИ
// ========================================

// Настройка слушателя Firebase для автоматических обновлений
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

// Обновление статуса в Firebase
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

// ========================================
// РЕНДЕР ФУНКЦИИ
// ========================================

// Рендер списка сотрудников
function renderEmployeeSelect() {
  employees.forEach((emp) => {
    const option = document.createElement('option');
    option.value = emp;
    option.textContent = emp;
    elements.employeeSelect.appendChild(option);
  });
}

// Рендер кнопок статусов
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

// Рендер панели администратора
function renderAdminPanel() {
  renderStats();
  renderEmployeesList();
}

// Рендер статистики
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

// Рендер списка сотрудников
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

// ========================================
// ОБРАБОТЧИКИ СОБЫТИЙ
// ========================================

// Выбор статуса
function selectStatus(statusId) {
  state.selectedStatus = statusId;
  document.querySelectorAll('.status-btn').forEach((btn) => {
    btn.classList.toggle('selected', btn.dataset.statusId === statusId);
  });
}

// Настройка обработчиков событий
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

// Обновление статуса
async function updateStatus() {
  if (!state.selectedEmployee || !state.selectedStatus) {
    showError('בחר/י את השם שלך ואת המיקום שלך');
    return;
  }

  try {
    // Показываем индикатор загрузки
    elements.updateStatusBtn.disabled = true;
    elements.updateStatusBtn.textContent = 'Loading...';

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
    elements.updateStatusBtn.textContent = 'Update status';
  }
}

// Вход администратора
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

// Выход администратора
function handleAdminLogout() {
  state.isAdmin = false;
  elements.adminPassword.value = '';
  showEmployeeForm();
}

// Показать панель администратора
function showAdminPanel() {
  elements.employeeForm.style.display = 'none';
  elements.adminPanel.style.display = 'flex';
  elements.logoutBtn.style.display = 'flex';
}

// Показать форму сотрудника
function showEmployeeForm() {
  elements.employeeForm.style.display = 'flex';
  elements.adminPanel.style.display = 'none';
  elements.logoutBtn.style.display = 'none';
}

// ========================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ========================================

// Получить количество по статусам
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

// Получить название статуса
function getStatusLabel(statusId) {
  return statuses.find((s) => s.id === statusId)?.label || 'Не указан';
}

// Получить класс цвета статуса
function getStatusColor(statusId) {
  return statuses.find((s) => s.id === statusId)?.color || 'unknown';
}

// Показать ошибку
function showError(message) {
  elements.errorMsg.textContent = message;
  elements.errorMsg.style.display = 'block';
  elements.successMsg.style.display = 'none';
}

// Скрыть ошибку
function hideError() {
  elements.errorMsg.style.display = 'none';
}

// Показать успех
function showSuccess(message) {
  elements.successMsg.textContent = message;
  elements.successMsg.style.display = 'block';
  elements.errorMsg.style.display = 'none';
  setTimeout(() => {
    elements.successMsg.style.display = 'none';
  }, 3000);
}

// ========================================
// ЗАПУСК ПРИЛОЖЕНИЯ
// ========================================
document.addEventListener('DOMContentLoaded', init);
