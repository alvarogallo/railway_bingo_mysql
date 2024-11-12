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
            await pool.query('DROP TABLE IF EXISTS parametros');

            // Crear nueva tabla
            await pool.query(`
                CREATE TABLE parametros (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    nombre VARCHAR(50) NOT NULL UNIQUE,
                    valor VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            `);

            // Insertar parámetro inicial
            await pool.query(`
                INSERT INTO parametros (nombre, valor) 
                VALUES ('segundos', '20')
            `);

            res.json({ 
                success: true, 
                message: 'Tabla parametros recreada e inicializada con éxito'
            });
        } catch (error) {
            console.error('Error al configurar la base de datos:', error);
            res.json({ 
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
            const [tables] = await pool.query(`
                SELECT 
                    table_name, 
                    column_name, 
                    data_type,
                    is_nullable,
                    column_key,
                    extra
                FROM 
                    information_schema.columns 
                WHERE 
                    table_schema = DATABASE()
                ORDER BY 
                    table_name, 
                    ordinal_position
            `);

            // Organizar la información por tablas
            const tableStructure = {};
            tables.forEach(column => {
                if (!tableStructure[column.table_name]) {
                    tableStructure[column.table_name] = [];
                }
                tableStructure[column.table_name].push({
                    name: column.column_name,
                    type: column.data_type,
                    nullable: column.is_nullable,
                    key: column.column_key,
                    extra: column.extra
                });
            });

            res.json(tableStructure);
        } catch (error) {
            res.json({ error: 'Error al obtener información de las tablas' });
        }
    });
}

module.exports = setupWebRoutes;