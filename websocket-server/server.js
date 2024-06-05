const express = require('express');
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 8081;

const wss = new WebSocket.Server({ noServer: true });

async function startServer() {
  let fetch;
  try {
    const fetchModule = await import('node-fetch');
    fetch = fetchModule.default;
  } catch (err) {
    console.error('Failed to load node-fetch with dynamic import:', err);
    return;
  }


  wss.on('connection', function connection(ws) {
    console.log('A client connected');

    ws.on('message', function incoming(message) {
      console.log('received: %s', message);
      
      fetchWeatherData(message)
        .then(data => {
          ws.send(JSON.stringify(data));
        })
        .catch(error => {
          console.error('Error fetching weather data:', error);
          
          ws.send(JSON.stringify({ error: 'Error fetching weather data' }));
        });
    });

   
    ws.send('Hello, client! You are connected to the WebSocket server.');
  });

  
  async function fetchWeatherData(city) {
    const APIKey = 'b9a1454443aaf648f44484f69396de38';
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${APIKey}`;

    const response = await fetch(url);
    const data = await response.json();

    return data;
  }

  
  app.server = app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });

  
  app.server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });
}

startServer().catch(err => {
  console.error('Error starting server:', err);
});


