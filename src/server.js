const express = require('express');
const AmbienteTimer = require('./ambiente');
const setupApiRoutes = require('./api');

const app = express();
const port = 3000;

// Instancia del ambiente
const ambienteTimer = new AmbienteTimer();

// Configurar rutas API
app.use('/api', setupApiRoutes(ambienteTimer));

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});