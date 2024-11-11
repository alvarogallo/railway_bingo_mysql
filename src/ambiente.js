class AmbienteTimer {
    constructor() {
        this.conexiones = 0;
        this.createdAt = null;
        this.expiresAt = null;
        this.timer = null;
        this.hoursToLive = 1;
        this.conexionesActivas = new Set();
        this.timeStarts = [];
        this.startTimers = [];
        this.conexion_mysql = false;
        this.pool = null;
    }

    setMySQLConnection(pool) {
        this.pool = pool;
        this.conexion_mysql = !!pool;
    }

    async initialize(ip) {
        if (!this.createdAt) {
            this.createdAt = new Date();
            this.conexiones = 1;
            this.conexionesActivas.add(ip);
            this.updateExpirationTime();
            this.calculateTimeStarts();
            this.setTimer();
            
            if (this.conexion_mysql && this.pool) {
                try {
                    await this.pool.query(
                        'INSERT INTO conexiones (ip, expires_at) VALUES (?, ?)',
                        [ip, this.expiresAt]
                    );
                } catch (error) {
                    // Silenciosamente fallar y deshabilitar MySQL
                    this.conexion_mysql = false;
                    this.pool = null;
                }
            }
            
            console.log(`Primera conexión desde ${ip}. Ambiente inicializado.`);
        }
    }

    async addConexion(ip) {
        if (!this.conexionesActivas.has(ip)) {
            this.conexiones += 1;
            this.conexionesActivas.add(ip);
            this.updateExpirationTime();
            this.setTimer();

            if (this.conexion_mysql && this.pool) {
                try {
                    await this.pool.query(
                        'INSERT INTO conexiones (ip, expires_at) VALUES (?, ?)',
                        [ip, this.expiresAt]
                    );
                } catch (error) {
                    // Silenciosamente fallar y deshabilitar MySQL
                    this.conexion_mysql = false;
                    this.pool = null;
                }
            }

            console.log(`Nueva conexión desde ${ip}. Total conexiones: ${this.conexiones}`);
        } else {
            this.updateExpirationTime();
            this.setTimer();
            console.log(`Conexión existente desde ${ip}. Extendiendo tiempo.`);
        }
    }

    async reset() {
        this.startTimers.forEach(timer => clearTimeout(timer));
        this.startTimers = [];
        
        if (this.conexion_mysql && this.pool) {
            try {
                await this.pool.query('DELETE FROM time_starts WHERE 1=1');
                await this.pool.query('DELETE FROM conexiones WHERE 1=1');
            } catch (error) {
                // Silenciosamente fallar y deshabilitar MySQL
                this.conexion_mysql = false;
                this.pool = null;
            }
        }

        this.conexiones = 0;
        this.createdAt = null;
        this.expiresAt = null;
        this.timer = null;
        this.conexionesActivas.clear();
        this.timeStarts = [];
    }

    // El resto de los métodos permanecen igual...
    updateExpirationTime() {
        this.expiresAt = new Date(Date.now() + (this.hoursToLive * 60 * 60 * 1000));
        this.calculateTimeStarts();
    }

    calculateTimeStarts() {
        const now = new Date();
        let nextPoints = [];
        
        for (let hour = now.getHours(); hour <= now.getHours() + 1; hour++) {
            for (let minutes of [0, 30]) {
                let pointTime = new Date(now);
                pointTime.setHours(hour, minutes, 0, 0);
                
                if (pointTime > now) {
                    nextPoints.push(pointTime);
                }
            }
        }

        this.startTimers.forEach(timer => clearTimeout(timer));
        this.startTimers = [];

        this.timeStarts = nextPoints
            .sort((a, b) => a - b)
            .slice(0, 2)
            .map(date => ({
                time: date.toLocaleTimeString('es-ES', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                }),
                timestamp: date.getTime()
            }));

        this.timeStarts.forEach(point => {
            const timeUntilStart = point.timestamp - Date.now();
            if (timeUntilStart > 0) {
                const timer = setTimeout(() => {
                    console.log('\x1b[32m%s\x1b[0m', `=== HORA DE ARRANCAR (${point.time}) ===`);
                }, timeUntilStart);
                this.startTimers.push(timer);
            }
        });
    }

    setTimer() {
        if (this.timer) {
            clearTimeout(this.timer);
        }
        this.timer = setTimeout(() => {
            this.reset();
            console.log('Ambiente reseteado por timeout');
        }, this.hoursToLive * 60 * 60 * 1000);
    }

    getStatus() {
        const now = Date.now();
        return {
            conexiones: this.conexiones,
            createdAt: this.createdAt?.toLocaleString(),
            expiresAt: this.expiresAt?.toLocaleString(),
            currentTime: new Date().toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
            }),
            timeStarts: this.timeStarts.map(point => ({
                ...point,
                secondsUntilStart: Math.max(0, Math.round((point.timestamp - now) / 1000))
            })),
            isActive: !!this.timer,
            conexion_mysql: this.conexion_mysql
        };
    }

    getTimeStarts() {
        const now = Date.now();
        return {
            currentTime: new Date().toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
            }),
            timeStarts: this.timeStarts.map(point => ({
                ...point,
                secondsUntilStart: Math.max(0, Math.round((point.timestamp - now) / 1000))
            }))
        };
    }
}

module.exports = AmbienteTimer;