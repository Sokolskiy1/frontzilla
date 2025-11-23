// Функция для отображения сообщений
function showMessage(message, type = 'error') {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;

    // Автоматически скрываем сообщение через 5 секунд
    setTimeout(() => {
        messageDiv.textContent = '';
        messageDiv.className = 'message';
    }, 5000);
}

// Функция для отображения ссылки на загруженный файл
function showFileLink(fileUrl, message) {
    const fileLinkDiv = document.getElementById('fileLink');
    fileLinkDiv.innerHTML = `
        <p>${message}</p>
        <p><strong>Ссылка на файл:</strong> <a href="${fileUrl}" target="_blank">${fileUrl}</a></p>
    `;
    fileLinkDiv.style.display = 'block';

    // Автоматически скрываем ссылку через 30 секунд (больше времени чем для обычных сообщений)
    setTimeout(() => {
        fileLinkDiv.style.display = 'none';
        fileLinkDiv.innerHTML = '';
    }, 30000);
}

// Функция проверки авторизации
function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    console.log('Проверка авторизации на странице файлов. Токен:', token);

    if (!token) {
        console.log('Токен не найден, перенаправляем на index.html');
        // Если токена нет, перенаправляем на главную страницу
        window.location.href = 'index.html';
        return false;
    }

    console.log('Токен найден, авторизация успешна');
    return true;
}

// Функция выхода
function handleLogout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUsername');
    localStorage.removeItem('authPassword');
    window.location.href = 'index.html';
}

// Функция загрузки списка файлов
async function loadFiles() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('http://localhost:8080/api/files/full_list', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        });

        if (response.ok) {
            const files = await response.json();
            displayFiles(files);
        } else if (response.status === 401) {
            // Токен истек или недействителен
            handleLogout();
        } else {
            showMessage('Ошибка загрузки файлов', 'error');
        }
    } catch (error) {
        console.error('Ошибка загрузки файлов:', error);
        showMessage('Ошибка подключения к серверу', 'error');
    }
}

// Функция отображения файлов
function displayFiles(files) {
    const fileList = document.getElementById('fileList');

    if (!files || files.length === 0) {
        fileList.innerHTML = '<div class="file-item empty-state"><p>Файлы не найдены. Загрузите первый файл!</p></div>';
        return;
    }

    fileList.innerHTML = files.map(file => `
        <div class="file-item">
            <div class="file-info">
                <div class="file-name">${file.name}</div>
                <div class="file-size">${formatFileSize(file.size)}</div>
                <div class="file-date">${new Date(file.uploadDate).toLocaleDateString('ru-RU')}</div>
            </div>
            <div class="file-actions">
                <button class="download-btn" onclick="downloadFile('${file.id}')">Скачать</button>
                <button class="delete-btn" onclick="deleteFile('${file.id}')">Удалить</button>
            </div>
        </div>
    `).join('');
}

// Функция форматирования размера файла
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Функция получения расширения файла
function getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
}

// Функция загрузки файла
async function uploadFile(file) {
    try {
        const username = localStorage.getItem('authUsername');
        const password = localStorage.getItem('authPassword');

        if (!username || !password) {
            showMessage('Ошибка авторизации. Пожалуйста, войдите снова.', 'error');
            handleLogout();
            return;
        }

        // Создаем basic auth header
        const credentials = btoa(`${username}:${password}`);
        const fileExtension = getFileExtension(file.name);

        const response = await fetch('http://localhost:8080/api/file', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'X-File-Type': fileExtension,
                'Content-Type': 'application/octet-stream',
            },
            body: file
        });

        if (response.ok) {
            try {
                const data = await response.json();
                console.log('Ответ сервера:', data);

                if (data.success && data.uuid) {
                    const fileUrl = `http://localhost:8080/api/file/?uuid=${data.uuid}`;
                    showFileLink(fileUrl, data.message || 'Файл успешно загружен');
                    loadFiles(); // Перезагружаем список файлов после успешной загрузки
                } else {
                    showMessage(data.message || 'Файл успешно загружен', 'success');
                }
            } catch (e) {
                console.error('Ошибка парсинга JSON ответа:', e);
                showMessage('Файл успешно загружен', 'success');
            }

            closeUploadModal();
        } else if (response.status === 401) {
            showMessage('Ошибка авторизации', 'error');
            handleLogout();
        } else {
            try {
                const error = await response.json();
                showMessage(error.message || 'Ошибка загрузки файла', 'error');
            } catch (e) {
                showMessage('Ошибка загрузки файла', 'error');
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки файла:', error);
        showMessage('Ошибка подключения к серверу', 'error');
    }
}

// Функция скачивания файла
async function downloadFile(fileId) {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`http://localhost:8080/api/files/${fileId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            }
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'downloaded_file'; // В реальном приложении использовать оригинальное имя файла
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } else if (response.status === 401) {
            handleLogout();
        } else {
            showMessage('Ошибка скачивания файла', 'error');
        }
    } catch (error) {
        console.error('Ошибка скачивания файла:', error);
        showMessage('Ошибка подключения к серверу', 'error');
    }
}

// Функция удаления файла
async function deleteFile(fileId) {
    if (!confirm('Вы уверены, что хотите удалить этот файл?')) {
        return;
    }

    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`http://localhost:8080/api/files/${fileId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            }
        });

        if (response.ok) {
            showMessage('Файл успешно удален', 'success');
            loadFiles(); // Перезагружаем список файлов
        } else if (response.status === 401) {
            handleLogout();
        } else {
            showMessage('Ошибка удаления файла', 'error');
        }
    } catch (error) {
        console.error('Ошибка удаления файла:', error);
        showMessage('Ошибка подключения к серверу', 'error');
    }
}

// Функции для модального окна загрузки
function openUploadModal() {
    document.getElementById('uploadModal').style.display = 'block';
}

function closeUploadModal() {
    document.getElementById('uploadModal').style.display = 'none';
    document.getElementById('uploadForm').reset();
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Проверяем авторизацию
    if (!checkAuthStatus()) {
        return;
    }

    // Загружаем файлы
    loadFiles();

    // Обработчик кнопки выхода
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Обработчик кнопки загрузки файла
    const uploadBtn = document.getElementById('uploadBtn');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', openUploadModal);
    }

    // Обработчик кнопки погоды
    const weatherBtn = document.getElementById('weatherBtn');
    if (weatherBtn) {
        weatherBtn.addEventListener('click', () => {
            window.location.href = 'weather.html';
        });
    }

    // Обработчики для модального окна
    const modal = document.getElementById('uploadModal');
    const closeBtn = document.querySelector('.close-modal');
    const cancelBtn = document.querySelector('.cancel-btn');

    if (closeBtn) {
        closeBtn.addEventListener('click', closeUploadModal);
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeUploadModal);
    }

    // Закрытие модального окна при клике вне его
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeUploadModal();
        }
    });

    // Обработчик формы загрузки файла
    const uploadForm = document.getElementById('uploadForm');
    if (uploadForm) {
        uploadForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const fileInput = document.getElementById('fileInput');
            const file = fileInput.files[0];

            if (file) {
                uploadFile(file);
            }
        });
    }
});
