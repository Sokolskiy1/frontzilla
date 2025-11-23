// Получаем элементы формы
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const messageDiv = document.getElementById('message');

// Элементы для регистрации
const registerForm = document.getElementById('registerForm');
const regUsernameInput = document.getElementById('regUsername');
const regPasswordInput = document.getElementById('regPassword');
const logoutBtn = document.getElementById('logoutBtn');
const testBtn = document.getElementById('testBtn');

// Проверяем наличие элементов
console.log('Проверка элементов DOM:');
console.log('loginForm:', loginForm);
console.log('usernameInput:', usernameInput);
console.log('passwordInput:', passwordInput);
console.log('registerForm:', registerForm);
console.log('regUsernameInput:', regUsernameInput);
console.log('regPasswordInput:', regPasswordInput);
console.log('testBtn:', testBtn);

// Функция для отображения сообщений
function showMessage(message, type = 'error') {
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;

    // Автоматически скрываем сообщение через 5 секунд
    setTimeout(() => {
        messageDiv.textContent = '';
        messageDiv.className = 'message';
    }, 5000);
}

// Функция валидации формы
function validateForm(username, password) {
    if (username.trim().length < 3) {
        showMessage('Имя пользователя должно содержать минимум 3 символа');
        return false;
    }

    if (password.length < 6) {
        showMessage('Пароль должен содержать минимум 6 символов');
        return false;
    }

    return true;
}

// Функция обработки логина
async function handleLogin(username, password) {
    console.log('Отправка запроса на логин:', { username, password });

    try {
        const response = await fetch('http://127.0.0.1:8080/api/auth', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                login: username,
                password: password
            })
        });

        console.log('Получен ответ:', response.status, response.statusText);

        const data = await response.json();
        console.log('Данные ответа:', data);

        if (response.ok && data.uuid) {
            // Сохраняем uuid как токен в localStorage
            localStorage.setItem('authToken', data.uuid);
            // Сохраняем учетные данные для basic auth
            localStorage.setItem('authUsername', username);
            localStorage.setItem('authPassword', password);
            console.log('UUID сохранен:', data.uuid);
            console.log('Проверка сохраненного токена:', localStorage.getItem('authToken'));
            return { success: true, message: data.message || 'Вход выполнен успешно!' };
        } else {
            console.log('Ошибка авторизации:', data.error || 'Неизвестная ошибка');
            return { success: false, message: data.error || 'Ошибка авторизации' };
        }
    } catch (error) {
        console.error('Ошибка сети:', error);
        throw { success: false, message: 'Ошибка подключения к серверу' };
    }
}

// Функция регистрации пользователя
async function handleRegister(username, password) {
    console.log('Отправка запроса на регистрацию:', { username, password });

    try {
        const response = await fetch('http://localhost:8080/api/user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                login: username,
                password: password
            })
        });

        console.log('Получен ответ:', response.status, response.statusText);

        const data = await response.json();
        console.log('Данные ответа:', data);

        if (response.ok) {
            return { success: true, message: data.message || 'Регистрация выполнена успешно!' };
        } else {
            return { success: false, message: data.error || 'Ошибка регистрации' };
        }
    } catch (error) {
        console.error('Ошибка сети:', error);
        throw { success: false, message: 'Ошибка подключения к серверу' };
    }
}

// Функция выхода
function handleLogout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUsername');
    localStorage.removeItem('authPassword');
    showLoginForm();
    showMessage('Вы успешно вышли из системы', 'success');
}

// Функция проверки авторизации
function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    console.log('Проверка авторизации на главной странице. Токен:', token);

    if (token) {
        console.log('Токен найден, перенаправляем на files.html');
        // Если пользователь авторизован, перенаправляем на страницу файлов
        window.location.href = 'files.html';
    } else {
        console.log('Токен не найден, показываем форму логина');
        showLoginForm();
    }
}

// Функция отображения формы логина
function showLoginForm() {
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('registerSection').style.display = 'none';
    document.getElementById('dashboardSection').style.display = 'none';
}

// Функция отображения формы регистрации
function showRegisterForm() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('registerSection').style.display = 'block';
    document.getElementById('dashboardSection').style.display = 'none';
}

// Функция отображения дашборда
function showDashboard() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('registerSection').style.display = 'none';
    document.getElementById('dashboardSection').style.display = 'block';
}

// Обработчик отправки формы логина
console.log('Установка обработчика формы логина...');
if (loginForm) {
    console.log('Форма логина найдена');
    loginForm.addEventListener('submit', async (e) => {
        console.log('Сработал submit формы логина');
        e.preventDefault();

        const username = usernameInput.value;
        const password = passwordInput.value;

        console.log('Получены данные:', { username, password });

        // Валидация формы
        if (!validateForm(username, password)) {
            console.log('Валидация не пройдена');
            return;
        }

        console.log('Валидация пройдена, отправка запроса...');

        // Отключаем кнопку во время обработки
        const submitBtn = loginForm.querySelector('.login-btn');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Вход...';

        try {
            const result = await handleLogin(username, password);
            console.log('Результат логина:', result);

            if (result.success) {
                showMessage(result.message, 'success');
                console.log('Успешная авторизация, перенаправляем на files.html');
                console.log('Токен перед перенаправлением:', localStorage.getItem('authToken'));
                // Перенаправляем на страницу файлов после успешной авторизации
                setTimeout(() => {
                    console.log('Выполняем перенаправление на files.html');
                    window.location.href = 'files.html';
                }, 1500); // Увеличиваем задержку для отладки
            } else {
                console.log('Неудачная авторизация:', result.message);
            }
        } catch (error) {
            console.error('Ошибка при логине:', error);
            showMessage(error.message, 'error');
        } finally {
            // Восстанавливаем кнопку
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
} else {
    console.error('Форма логина не найдена!');
}

// Обработчик отправки формы регистрации
console.log('Установка обработчика формы регистрации...');
if (registerForm) {
    console.log('Форма регистрации найдена');
    registerForm.addEventListener('submit', async (e) => {
        console.log('Сработал submit формы регистрации');
        e.preventDefault();

        const username = regUsernameInput.value;
        const password = regPasswordInput.value;

        console.log('Получены данные регистрации:', { username, password });

        // Валидация формы
        if (!validateForm(username, password)) {
            console.log('Валидация регистрации не пройдена');
            return;
        }

        console.log('Валидация регистрации пройдена, отправка запроса...');

        // Отключаем кнопку во время обработки
        const submitBtn = registerForm.querySelector('.register-btn');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Регистрация...';

        try {
            const result = await handleRegister(username, password);

            if (result.success) {
                showMessage(result.message, 'success');
                showLoginForm();
                // Очищаем поля формы
                regUsernameInput.value = '';
                regPasswordInput.value = '';
            }
        } catch (error) {
            showMessage(error.message, 'error');
        } finally {
            // Восстанавливаем кнопку
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
} else {
    console.log('Форма регистрации не найдена');
}

// Обработчик кнопки выхода
if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
}

// Функции для переключения форм
function switchToRegister() {
    showRegisterForm();
    if (regUsernameInput) regUsernameInput.focus();
}

function switchToLogin() {
    showLoginForm();
    usernameInput.focus();
}

// Добавляем обработчики для ссылок переключения
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM загружен, устанавливаю обработчики...');

    // Проверяем статус авторизации
    checkAuthStatus();

    // Добавляем обработчики для ссылок
    const showRegisterLink = document.getElementById('showRegister');
    const showLoginLink = document.getElementById('showLogin');

    console.log('Ссылки найдены:', { showRegisterLink, showLoginLink });

    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Переход к форме регистрации');
            switchToRegister();
        });
    }

    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Переход к форме входа');
            switchToLogin();
        });
    }

    // Обработчик тестовой кнопки
    if (testBtn) {
        testBtn.addEventListener('click', () => {
            console.log('Тестовая кнопка нажата! JavaScript работает.');
            alert('JavaScript работает! Проверьте консоль браузера (F12).');
        });
    }
});

// Добавляем обработку клавиши Enter для быстрого входа
document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && document.activeElement === usernameInput) {
        passwordInput.focus();
    }
    if (e.key === 'Enter' && document.activeElement === regUsernameInput && regPasswordInput) {
        regPasswordInput.focus();
    }
});
