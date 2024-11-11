require('dotenv').config();
const mysql = require('mysql2/promise');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Mantener el servidor activo para ver logs
app.get('/', (req, res) => {
    res.send('Test server running');
});

async function testDatabaseConnection() {
    console.log('==========================================');
    console.log('TEST DE CONEXIÓN A BASE DE DATOS');
    console.log('==========================================');

    // Mostrar variables de entorno
    console.log('\nVariables configuradas:');
    console.log('HOST:', process.env.DB_HOST);
    console.log('PORT:', process.env.DB_PORT);
    console.log('USER:', process.env.DB_USER);
    console.log('DATABASE:', process.env.DB_NAME);
    console.log('PASSWORD:', process.env.DB_PASSWORD ? '[CONFIGURADA]' : '[NO CONFIGURADA]');

    const config = {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: {
            rejectUnauthorized: false
        }
    };

    try {
        console.log('\nIntentando conexión...');
        const connection = await mysql.createConnection(config);
        
        console.log('✓ CONEXIÓN EXITOSA');

        // Tests básicos
        console.log('\nEjecutando pruebas:');
        
        const [version] = await connection.query('SELECT VERSION() as version');
        console.log('- Versión MySQL:', version[0].version);
        
        const [database] = await connection.query('SELECT DATABASE() as db');
        console.log('- Base de datos actual:', database[0].db);
        
        const [tables] = await connection.query('SHOW TABLES');
        console.log('- Tablas encontradas:', tables.length);
        tables.forEach(table => {
            console.log('  >', Object.values(table)[0]);
        });

        await connection.end();
        console.log('\n✓ TEST COMPLETADO CON ÉXITO');

    } catch (error) {
        console.log('\n✗ ERROR DE CONEXIÓN');
        console.log('Código:', error.code);
        console.log('Mensaje:', error.message);
        
        console.log('\nPosibles soluciones:');
        if (error.code === 'ECONNREFUSED') {
            console.log('- Verifica host y puerto');
            console.log('- Confirma que MySQL esté activo');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('- Verifica usuario y contraseña');
        } else {
            console.log('- Revisa todas las variables de entorno');
        }
    }
}

// Iniciar servidor y ejecutar test
app.listen(port, async () => {
    console.log(`Servidor de prueba iniciado en puerto ${port}`);
    await testDatabaseConnection();
    console.log('\nServidor mantenido activo para ver logs...');
});

// Mantener el proceso activo
process.on('SIGTERM', () => {
    console.log('Proceso terminado');
    process.exit(0);
});