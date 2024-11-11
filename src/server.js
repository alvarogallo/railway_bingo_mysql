require('dotenv').config();
const express = require('express');
const AmbienteTimer = require('./ambiente');
const setupApiRoutes = require('./api');
const { createPool } = require('./config/database');

const app = express();
const port = process.env.PORT || 3000;

async function startServer() {
    // Instancia del ambiente
    const ambienteTimer = new AmbienteTimer();

    try {
        // Intentar crear pool de conexiones
        const pool = await createPool();
        ambienteTimer.setMySQLConnection(pool);
    } catch (error) {
        console.log('\x1b[33m%s\x1b[0m', 'No conexión base de datos');
        // Continuar sin MySQL
    }

    // Configurar rutas API
    app.use('/api', setupApiRoutes(ambienteTimer));

    app.listen(port, () => {
        console.log(`Servidor corriendo en http://localhost:${port}`);
        console.log(`Ambiente: ${process.env.NODE_ENV}`);
    });
}

startServer();