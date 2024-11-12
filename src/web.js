const path = require('path');
const express = require('express');

function setupWebRoutes(app, pool) {
    // Servir archivos estáticos desde la carpeta public
    app.use(express.static(path.join(__dirname, '../public')));

    // Ruta para recrear la tabla parametros
    app.get('/setup-db', async (req, res) => {
        if (!pool) {
            return res.json({ error: 'No hay conexión a la base de datos' });
        }

        try {
            // Eliminar tabla si existe
            await pool.execute('DROP TABLE IF EXISTS parametros');

            // Crear nueva tabla
            const createTableSQL = `
                CREATE TABLE parametros (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    nombre VARCHAR(50) NOT NULL UNIQUE,
                    valor VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `;
            await pool.execute(createTableSQL);

            // Insertar parámetro inicial
            await pool.execute(
                'INSERT INTO parametros (nombre, valor) VALUES (?, ?)',
                ['segundos', '20']
            );

            res.json({ 
                success: true, 
                message: 'Tabla parametros recreada e inicializada con éxito'
            });

        } catch (error) {
            console.error('Error en setup-db:', error);
            res.status(500).json({ 
                error: 'Error al configurar la base de datos', 
                details: error.message
            });
        }
    });

    // Ruta para obtener la estructura de las tablas
    app.get('/tables-info', async (req, res) => {
        if (!pool) {
            return res.json({ error: 'No hay conexión a la base de datos' });
        }

        try {
            // Primero, obtener todas las tablas
            const [tablas] = await pool.query(`
                SHOW TABLES
            `);
            
            const tableStructure = {};
            
            // Para cada tabla, obtener su estructura
            for (const tabla of tablas) {
                const tableName = tabla[`Tables_in_${process.env.MYSQL_DATABASE}`];
                
                const [columns] = await pool.query(`
                    SHOW COLUMNS FROM ${tableName}
                `);
                
                tableStructure[tableName] = columns.map(column => ({
                    name: column.Field,
                    type: column.Type,
                    nullable: column.Null,
                    key: column.Key,
                    extra: column.Extra
                }));
            }

            console.log('Estructura encontrada:', tableStructure);
            res.json(tableStructure);

        } catch (error) {
            console.error('Error en tables-info:', error);
            res.status(500).json({ 
                error: 'Error al obtener información de las tablas',
                details: error.message 
            });
        }
    });

    // Ruta adicional para verificar directamente la tabla parametros
    app.get('/check-parametros', async (req, res) => {
        if (!pool) {
            return res.json({ error: 'No hay conexión a la base de datos' });
        }

        try {
            const [columns] = await pool.query('SHOW COLUMNS FROM parametros');
            const [data] = await pool.query('SELECT * FROM parametros');
            
            res.json({
                estructura: columns,
                datos: data
            });
        } catch (error) {
            res.status(500).json({ 
                error: 'Error al verificar tabla parametros',
                details: error.message 
            });
        }
    });
}

module.exports = setupWebRoutes;