require('dotenv').config();
const mysql = require('mysql2/promise');

async function testConnection() {
    // Mostrar configuración (sin mostrar la contraseña completa)
    console.log('\nConfiguración actual:');
    console.log('HOST:', process.env.DB_HOST);
    console.log('PORT:', process.env.DB_PORT);
    console.log('USER:', process.env.DB_USER);
    console.log('DATABASE:', process.env.DB_NAME);
    console.log('PASSWORD:', process.env.DB_PASSWORD ? '****' : 'no configurada');

    const config = {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
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
        console.log('\n✅ Conexión exitosa!');
        
        // Probar una consulta simple
        const [result] = await connection.query('SELECT 1 + 1 AS result');
        console.log('Prueba de consulta:', result[0].result);
        
        await connection.end();
    } catch (error) {
        console.log('\n❌ Error de conexión:');
        console.log('Código:', error.code);
        console.log('Mensaje:', error.message);
        
        // Sugerencias basadas en el error
        console.log('\nPosibles soluciones:');
        switch (error.code) {
            case 'ECONNREFUSED':
                console.log('- Verifica que el host y puerto sean correctos');
                console.log('- Confirma que el servidor MySQL esté activo');
                console.log('- Revisa si hay restricciones de firewall');
                break;
            case 'ER_ACCESS_DENIED_ERROR':
                console.log('- Verifica el usuario y contraseña');
                console.log('- Confirma que el usuario tenga permisos');
                break;
            case 'ER_BAD_DB_ERROR':
                console.log('- La base de datos no existe');
                console.log('- Verifica el nombre de la base de datos');
                break;
            default:
                console.log('- Verifica todas las variables de entorno');
                console.log('- Confirma que las credenciales sean correctas');
                console.log('- Asegúrate de que la base de datos esté activa en Railway');
        }
    }
}

testConnection();