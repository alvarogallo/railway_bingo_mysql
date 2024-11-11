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
    queueLimit: 0
};

async function createPool() {
    try {
        const pool = await mysql.createPool(dbConfig);
        // Probar la conexión
        await pool.query('SELECT 1');
        return pool;
    } catch (error) {
        console.log('\x1b[33m%s\x1b[0m', 'No conexión base de datos');
        return null;
    }
}

module.exports = { createPool };