// Получаем элементы DOM
const cityInput = document.getElementById('cityInput');
const getWeatherBtn = document.getElementById('getWeatherBtn');
const weatherInfo = document.getElementById('weatherInfo');
const cityName = document.getElementById('cityName');
const latitude = document.getElementById('latitude');
const longitude = document.getElementById('longitude');
const weatherChart = document.getElementById('weatherChart');
const messageDiv = document.getElementById('message');
const backBtn = document.getElementById('backBtn');

let chart = null;

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

// Функция для получения погоды
async function getWeather(city) {
    try {
        const response = await fetch(`http://localhost:8080/api/weather?city=${encodeURIComponent(city)}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching weather data:', error);
        throw error;
    }
}

// Функция для форматирования времени
function formatTime(timeArray) {
    const [year, month, day, hour, minute] = timeArray;
    return `${day.toString().padStart(2, '0')}.${month.toString().padStart(2, '0')} ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

// Функция для отображения данных о погоде
function displayWeather(data) {
    // Отображаем информацию о городе
    cityName.textContent = data.city;
    latitude.textContent = data.latitude.toFixed(4);
    longitude.textContent = data.longitude.toFixed(4);

    // Показываем секцию с информацией
    weatherInfo.style.display = 'block';

    // Подготавливаем данные для графика
    const labels = data.hourlyWeather.map(item => formatTime(item.time));
    const temperatures = data.hourlyWeather.map(item => item.temperature);

    // Создаем или обновляем график
    if (chart) {
        chart.destroy();
    }

    const ctx = weatherChart.getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Температура (°C)',
                data: temperatures,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.1,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: `Погодный график для ${data.city}`
                },
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Температура (°C)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Время'
                    }
                }
            }
        }
    });
}

// Обработчик клика по кнопке "Получить погоду"
getWeatherBtn.addEventListener('click', async () => {
    const city = cityInput.value.trim();

    if (!city) {
        showMessage('Пожалуйста, введите название города');
        return;
    }

    // Показываем индикатор загрузки
    getWeatherBtn.disabled = true;
    getWeatherBtn.textContent = 'Загрузка...';

    try {
        const weatherData = await getWeather(city);
        displayWeather(weatherData);
        showMessage('Данные о погоде успешно загружены', 'success');
    } catch (error) {
        showMessage('Ошибка при загрузке данных о погоде. Проверьте подключение к серверу.');
        weatherInfo.style.display = 'none';
    } finally {
        // Возвращаем кнопку в исходное состояние
        getWeatherBtn.disabled = false;
        getWeatherBtn.textContent = 'Получить погоду';
    }
});

// Обработчик клика по кнопке "Назад"
backBtn.addEventListener('click', () => {
    // Возвращаемся на предыдущую страницу
    window.history.back();
});

// Обработчик нажатия Enter в поле ввода города
cityInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        getWeatherBtn.click();
    }
});

// Фокус на поле ввода при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    cityInput.focus();
});

