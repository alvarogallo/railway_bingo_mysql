require('dotenv').config();
const mysql = require('mysql2/promise');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

async function testDatabaseConnection() {
    console.log('==========================================');
    console.log('TEST DE CONEXIÓN A BASE DE DATOS');
    console.log('==========================================');

    // Mostrar variables de entorno y configuración
    console.log('\nVariables configuradas:');
    console.log('HOST:', process.env.DB_HOST);
    console.log('PORT:', process.env.DB_PORT);
    console.log('USER:', process.env.DB_USER);
    console.log('DATABASE:', process.env.DB_NAME);
    console.log('PASSWORD:', process.env.DB_PASSWORD ? '[CONFIGURADA]' : '[NO CONFIGURADA]');
    console.log('NODE_ENV:', process.env.NODE_ENV);

    const config = {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        connectTimeout: 10000, // 10 segundos
        ssl: {
            rejectUnauthorized: false
        }
    };

    try {
        console.log('\nIntentando conexión con timeout de 10 segundos...');
        console.log('URL de conexión:', `mysql://${config.user}:****@${config.host}:${config.port}/${config.database}`);
        
        const connection = await mysql.createConnection(config);
        console.log('✓ CONEXIÓN EXITOSA');

        const [version] = await connection.query('SELECT VERSION() as version');
        console.log('- Versión MySQL:', version[0].version);
        
        const [database] = await connection.query('SELECT DATABASE() as db');
        console.log('- Base de datos actual:', database[0].db);

        await connection.end();
        console.log('\n✓ TEST COMPLETADO CON ÉXITO');
        return true;

    } catch (error) {
        console.log('\n✗ ERROR DE CONEXIÓN');
        console.log('Tipo de error:', error.name);
        console.log('Código:', error.code);
        console.log('Mensaje:', error.message);
        
        console.log('\nDiagnóstico:');
        console.log('- Host alcanzable:', await isHostReachable(config.host));
        console.log('- Puerto correcto:', config.port === 11702 ? 'Sí' : 'No - Debería ser 11702');
        console.log('- SSL configurado:', config.ssl ? 'Sí' : 'No');
        
        return false;
    }
}

// Función para verificar si el host es alcanzable
async function isHostReachable(host) {
    try {
        const dns = require('dns').promises;
        await dns.lookup(host);
        return true;
    } catch {
        return false;
    }
}

// Ruta básica para mantener el servidor vivo
app.get('/', (req, res) => {
    res.send('Test server running');
});

// Iniciar servidor y ejecutar test
const server = app.listen(port, async () => {
    console.log(`Servidor de prueba iniciado en puerto ${port}`);
    const testResult = await testDatabaseConnection();
    
    if (!testResult) {
        console.log('\nCerrando servidor debido a error de conexión...');
        server.close(() => {
            process.exit(1);
        });
    } else {
        console.log('\nServidor mantenido activo temporalmente...');
        // Cerrar automáticamente después de 30 segundos
        setTimeout(() => {
            console.log('Cerrando servidor después de período de prueba...');
            server.close(() => {
                process.exit(0);
            });
        }, 30000);
    }
});

// Manejo de señales de terminación
process.on('SIGTERM', () => {
    console.log('Recibida señal SIGTERM');
    server.close(() => {
        console.log('Servidor cerrado correctamente');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('Recibida señal SIGINT');
    server.close(() => {
        console.log('Servidor cerrado correctamente');
        process.exit(0);
    });
});

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
    console.log('Error no capturado:', error);
    server.close(() => {
        process.exit(1);
    });
});