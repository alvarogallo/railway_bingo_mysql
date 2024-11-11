require('dotenv').config();
const mysql = require('mysql2/promise');

// Configuración de colores para consola
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    white: '\x1b[37m'
};

async function testDatabaseConnection() {
    console.log(`${colors.bright}${colors.blue}=== Test de Conexión a Base de Datos ===${colors.reset}\n`);

    // Mostrar variables de entorno
    console.log(`${colors.bright}Variables de entorno configuradas:${colors.reset}`);
    console.log(`HOST: ${colors.yellow}${process.env.DB_HOST}${colors.reset}`);
    console.log(`PORT: ${colors.yellow}${process.env.DB_PORT}${colors.reset}`);
    console.log(`USER: ${colors.yellow}${process.env.DB_USER}${colors.reset}`);
    console.log(`DATABASE: ${colors.yellow}${process.env.DB_NAME}${colors.reset}`);
    console.log(`PASSWORD: ${colors.yellow}${process.env.DB_PASSWORD ? '****' : 'no configurada'}${colors.reset}\n`);

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
        console.log(`${colors.bright}Intentando conexión...${colors.reset}`);
        console.time('Tiempo de conexión');
        
        const connection = await mysql.createConnection(config);
        console.timeEnd('Tiempo de conexión');
        
        console.log(`\n${colors.green}✓ Conexión establecida exitosamente${colors.reset}`);

        // Test 1: Consulta simple
        console.log('\n1. Prueba de consulta simple...');
        const [result1] = await connection.query('SELECT 1 + 1 AS result');
        console.log(`${colors.green}✓ Resultado: ${result1[0].result}${colors.reset}`);

        // Test 2: Versión de MySQL
        console.log('\n2. Versión de MySQL...');
        const [result2] = await connection.query('SELECT VERSION() as version');
        console.log(`${colors.green}✓ Versión: ${result2[0].version}${colors.reset}`);

        // Test 3: Base de datos actual
        console.log('\n3. Base de datos actual...');
        const [result3] = await connection.query('SELECT DATABASE() as db');
        console.log(`${colors.green}✓ Base de datos: ${result3[0].db}${colors.reset}`);

        // Test 4: Listar tablas
        console.log('\n4. Tablas en la base de datos...');
        const [tables] = await connection.query('SHOW TABLES');
        console.log(`${colors.green}✓ Tablas encontradas: ${tables.length}${colors.reset}`);
        tables.forEach(table => {
            const tableName = Object.values(table)[0];
            console.log(`  - ${tableName}`);
        });

        await connection.end();
        console.log(`\n${colors.green}${colors.bright}✓ Test completado exitosamente${colors.reset}`);

        // Mantener el proceso activo por un momento para que Railway pueda ver los logs
        await new Promise(resolve => setTimeout(resolve, 5000));
        process.exit(0);

    } catch (error) {
        console.log(`\n${colors.red}✗ Error de conexión:${colors.reset}`);
        console.log(`\nDetalles del error:`);
        console.log(`Código: ${colors.yellow}${error.code}${colors.reset}`);
        console.log(`Mensaje: ${colors.yellow}${error.message}${colors.reset}`);
        
        console.log(`\n${colors.bright}Posibles soluciones:${colors.reset}`);
        switch (error.code) {
            case 'ECONNREFUSED':
                console.log('- Verifica que el host y puerto sean correctos');
                console.log('- Confirma que el servidor MySQL esté activo');
                break;
            case 'ER_ACCESS_DENIED_ERROR':
                console.log('- Verifica el usuario y contraseña');
                console.log('- Confirma que el usuario tenga permisos');
                break;
            case 'ER_BAD_DB_ERROR':
                console.log('- La base de datos especificada no existe');
                console.log('- Verifica el nombre de la base de datos');
                break;
            default:
                console.log('- Verifica todas las variables de entorno');
                console.log('- Confirma que las credenciales sean correctas');
        }

        // Mantener el proceso activo por un momento para que Railway pueda ver los logs
        await new Promise(resolve => setTimeout(resolve, 5000));
        process.exit(1);
    }
}

// Ejecutar el test
testDatabaseConnection();