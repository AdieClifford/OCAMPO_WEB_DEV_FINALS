const container = document.querySelector('.container');
const search = document.querySelector('.search-box button');
const weatherBox = document.querySelector('.weather-box');
const weatherDetails = document.querySelector('.weather-details');
const errorDisplay = document.createElement('p');
errorDisplay.className = 'error';
container.appendChild(errorDisplay);

function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    document.getElementById('clock').textContent = `${hours}:${minutes}:${seconds} ${ampm}`;
    const month = now.toLocaleString('default', { month: 'long' });
    const day = now.getDate();
    const year = now.getFullYear();
    document.getElementById('date').textContent = `${month} ${day}, ${year}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    document.getElementById('timezone').textContent = `Timezone: ${timezone}`;
}

updateClock();
setInterval(updateClock, 1000);


const ws = new WebSocket('ws://localhost:8081');

ws.onopen = function () {
    console.log('Connected to WebSocket server');
};

ws.onmessage = function (event) {
    console.log('Message from server:', event.data);

    if (event.data.startsWith('Hello, client!')) {
        
        console.log('Received welcome message from server:', event.data);
    } else {
        try {
            const weatherData = JSON.parse(event.data);
            handleWeatherData(weatherData);
        } catch (error) {
            console.warn('Received non-JSON message:', event.data);
            errorDisplay.textContent = 'Unknown error occurred';
        }
    }
};




ws.onclose = function () {
    console.log('Disconnected from WebSocket server');
};

function handleWeatherData(json) {
    if (json.cod === '404') {
        errorDisplay.textContent = 'City not found. Please try again.';
        weatherBox.style.display = 'none';
        weatherDetails.style.display = 'none';
        return;
    }

    errorDisplay.textContent = '';
    weatherBox.style.display = 'block';
    weatherDetails.style.display = 'flex';

    const image = document.querySelector('.weather-box img');
    const temperature = document.querySelector('.weather-box .temperature');
    const description = document.querySelector('.weather-box .description');
    const wind = document.querySelector('.weather-details .Wind span');
    const humidity = document.querySelector('.weather-details .humidity span');

    switch (json.weather[0].main) {
        case 'Clear':
            image.src = 'image/clear.png';
            break;

        case 'Clouds':
            image.src = 'image/cloudy.png';
            break;

        case 'Rain':
            image.src = 'image/rain.png';
            break;

        case 'Mist':
            image.src = 'image/mist.png';
            break;

        case 'Haze':
            image.src = 'image/haze.png';
            break;

        case 'Snow':
            image.src = 'image/snow.png';
            break;

        default:
            image.src = 'image/cloudy.png';
    }

    temperature.innerHTML = `${parseInt(json.main.temp)}<span>°C</span>`;
    description.innerHTML = json.weather[0].description;
    wind.innerHTML = `${parseInt(json.wind.speed)} Km/hr`;
    humidity.innerHTML = `${json.main.humidity}%`;
}


search.addEventListener('click', () => {
    const APIKey = 'b9a1454443aaf648f44484f69396de38';
    const city = document.querySelector('.search-box input').value;

    if (city === '') return;

    
    ws.send(city);
});

const timeSearchInput = document.querySelector('.time-search-box input');
const timeSearchButton = document.querySelector('.time-search-box button');
const timeZoneSelectContainer = document.getElementById('timezone-select-container');
const timeZoneSelect = document.getElementById('timezone-select');
const getTimeButton = document.getElementById('get-time-button');
const timeOutput = document.getElementById('time-output');
const timeError = document.getElementById('time-error');

const worldTimeAPI = 'https://worldtimeapi.org/api/timezone/';

const searchTimeZones = () => {
    const country = timeSearchInput.value;
    if (country === '') return;

    timeOutput.textContent = 'Loading, please wait...';
    timeError.textContent = '';

    fetch(worldTimeAPI)
        .then(response => response.json())
        .then(data => {
            const filteredTimeZones = data.filter(timezone => timezone.toLowerCase().includes(country.toLowerCase()));

            if (filteredTimeZones.length === 0) {
                timeOutput.textContent = '';
                timeError.textContent = 'No timezones found for this country. Please try again.';
                timeZoneSelectContainer.style.display = 'none';
                return;
            }

            timeZoneSelect.innerHTML = filteredTimeZones.map(timezone => `<option value="${timezone}">${timezone}</option>`).join('');
            timeZoneSelectContainer.style.display = 'block';
            timeOutput.textContent = '';
        })
        .catch(() => {
            timeOutput.textContent = '';
            timeError.textContent = 'Something went wrong. Please try again later.';
            timeZoneSelectContainer.style.display = 'none';
        });
};

const getTimeForTimeZone = () => {
    const selectedTimeZone = timeZoneSelect.value;
    if (!selectedTimeZone) return;

    timeOutput.textContent = 'Loading, please wait...';
    timeError.textContent = '';

    fetch(`${worldTimeAPI}${selectedTimeZone}`)
        .then(response => response.json())
        .then(data => {
            if (!data.datetime) {
                timeOutput.textContent = '';
                timeError.textContent = 'Could not retrieve time. Please try again.';
                return;
            }

            const timeString = data.datetime.slice(11, 16); 
            const hours = parseInt(timeString.slice(0, 2)); 
            const minutes = timeString.slice(3);
            const ampm = hours >= 12 ? 'PM' : 'AM'; 
            const formattedHours = hours % 12 || 12; 

            timeOutput.textContent = `Time in ${selectedTimeZone}: ${formattedHours}:${minutes} ${ampm}`;

            timeOutput.style.fontSize = '2rem';

            const containerHeight = container.offsetHeight;
            const outputHeight = timeOutput.offsetHeight;
            const topPosition = (containerHeight - outputHeight) / 2.5; 
            timeOutput.style.position = 'absolute'; 
            timeOutput.style.right = '28%'; 
            timeOutput.style.top = `${topPosition}px`; 
        })
        .catch(() => {
            timeOutput.textContent = '';
            timeError.textContent = 'Something went wrong. Please try again later.';
        });
};

timeSearchButton.addEventListener('click', searchTimeZones);
getTimeButton.addEventListener('click', getTimeForTimeZone);
