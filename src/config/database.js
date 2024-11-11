require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: {
        rejectUnauthorized: false
    }
};

async function createPool() {
    try {
        // Verificar que todas las variables necesarias estén definidas
        const requiredVars = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
        const missingVars = requiredVars.filter(varName => !process.env[varName]);
        
        if (missingVars.length > 0) {
            console.log('\x1b[33m%s\x1b[0m', 'Variables de entorno faltantes:', missingVars.join(', '));
            return null;
        }

        console.log('\nIntentando conectar a:', process.env.DB_HOST);
        const pool = mysql.createPool(dbConfig);
        
        // Probar la conexión
        await pool.query('SELECT 1');
        console.log('\x1b[32m%s\x1b[0m', 'Conexión a base de datos establecida');
        return pool;
    } catch (error) {
        console.log('\x1b[33m%s\x1b[0m', 'Error de conexión a la base de datos:');
        console.log('Tipo:', error.code);
        console.log('Mensaje:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('Verifica las credenciales y que la base de datos esté activa en Railway');
        }
        
        return null;
    }
}

module.exports = { createPool };