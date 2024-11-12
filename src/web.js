const path = require('path');
const express = require('express');

function setupWebRoutes(app, pool) {
    // Servir archivos estáticos desde la carpeta public
    app.use(express.static(path.join(__dirname, '../public')));

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