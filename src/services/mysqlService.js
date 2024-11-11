class MySQLService {
    constructor(pool) {
        this.pool = pool;
        this.isConnected = !!pool;
    }

    async getParametro(nombre) {
        try {
            if (!this.isConnected) return null;
            
            const [rows] = await this.pool.query(
                'SELECT valor FROM parametros WHERE nombre = ?', 
                [nombre]
            );
            
            return rows.length > 0 ? rows[0].valor : null;
        } catch (error) {
            console.log('Error al obtener parámetro:', error.message);
            return null;
        }
    }

    async registrarConexion(ip, expiresAt) {
        try {
            if (!this.isConnected) return false;
            
            await this.pool.query(
                'INSERT INTO conexiones (ip, expires_at) VALUES (?, ?)',
                [ip, expiresAt]
            );
            
            return true;
        } catch (error) {
            console.log('Error al registrar conexión:', error.message);
            return false;
        }
    }

    async registrarTimeStart(startTime) {
        try {
            if (!this.isConnected) return false;
            
            await this.pool.query(
                'INSERT INTO time_starts (start_time) VALUES (?)',
                [startTime]
            );
            
            return true;
        } catch (error) {
            console.log('Error al registrar time start:', error.message);
            return false;
        }
    }

    async limpiarRegistros() {
        try {
            if (!this.isConnected) return false;
            
            await this.pool.query('DELETE FROM conexiones WHERE expires_at < NOW()');
            await this.pool.query('DELETE FROM time_starts WHERE start_time < NOW()');
            
            return true;
        } catch (error) {
            console.log('Error al limpiar registros:', error.message);
            return false;
        }
    }

    isConnected() {
        return this.isConnected;
    }
}

module.exports = MySQLService;