-- Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS your_database_name;
USE your_database_name;

-- Tabla para registrar conexiones
CREATE TABLE IF NOT EXISTS conexiones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ip VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL
);

-- Tabla para registrar puntos de arranque
CREATE TABLE IF NOT EXISTS time_starts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    start_time TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);