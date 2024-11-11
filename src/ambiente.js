const MySQLService = require('./services/mysqlService');

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
        this.intervalo = 30;
        this.mysqlService = null;
    }

    async setMySQLConnection(pool) {
        this.mysqlService = new MySQLService(pool);
        if (this.mysqlService.isConnected) {
            await this.loadParameters();
        }
    }

    async loadParameters() {
        try {
            const intervalo = await this.mysqlService.getParametro('intervalo');
            if (intervalo) {
                this.intervalo = parseInt(intervalo);
                console.log(`Intervalo cargado de la base de datos: ${this.intervalo} minutos`);
            }
        } catch (error) {
            console.log('Error al cargar parámetros:', error.message);
        }
    }

    formatTimeShort(date) {
        return date.toLocaleTimeString('es-CO', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }

    async initialize(ip) {
        if (!this.createdAt) {
            this.createdAt = new Date();
            this.conexiones = 1;
            this.conexionesActivas.add(ip);
            this.updateExpirationTime();
            this.calculateTimeStarts();
            this.setTimer();
            
            if (this.mysqlService?.isConnected) {
                await this.mysqlService.registrarConexion(ip, this.expiresAt);
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

            if (this.mysqlService?.isConnected) {
                await this.mysqlService.registrarConexion(ip, this.expiresAt);
            }

            console.log(`Nueva conexión desde ${ip}. Total conexiones: ${this.conexiones}`);
        } else {
            this.updateExpirationTime();
            this.setTimer();
            console.log(`Conexión existente desde ${ip}. Extendiendo tiempo.`);
        }
    }

    calculateTimeStarts() {
        const now = new Date();
        const currentMinutes = now.getMinutes();
        const currentHour = now.getHours();

        // Limpiar timers anteriores
        this.startTimers.forEach(timer => clearTimeout(timer));
        this.startTimers = [];

        // Calcular próximo intervalo
        const nextIntervalMinutes = Math.ceil(currentMinutes / this.intervalo) * this.intervalo;
        let firstPointHour = currentHour;
        let firstPointMinutes = nextIntervalMinutes;

        // Ajustar si pasamos a la siguiente hora
        if (firstPointMinutes >= 60) {
            firstPointHour++;
            firstPointMinutes = 0;
        }

        // Crear puntos de arranque
        const firstPoint = new Date(now);
        firstPoint.setHours(firstPointHour, firstPointMinutes, 0, 0);

        const secondPoint = new Date(firstPoint);
        if (firstPointMinutes + this.intervalo >= 60) {
            secondPoint.setHours(firstPointHour + 1, 0, 0, 0);
        } else {
            secondPoint.setMinutes(firstPointMinutes + this.intervalo);
        }

        this.timeStarts = [
            {
                time: this.formatTimeShort(firstPoint),
                timestamp: firstPoint.getTime()
            },
            {
                time: this.formatTimeShort(secondPoint),
                timestamp: secondPoint.getTime()
            }
        ];

        // Configurar timers
        this.timeStarts.forEach(point => {
            const timeUntilStart = point.timestamp - now.getTime();
            if (timeUntilStart > 0) {
                const timer = setTimeout(async () => {
                    console.log(`=== HORA DE ARRANCAR (${point.time}) ===`);
                    if (this.mysqlService?.isConnected) {
                        await this.mysqlService.registrarTimeStart(new Date(point.timestamp));
                    }
                }, timeUntilStart);
                this.startTimers.push(timer);
            }
        });

        console.log('Próximos puntos de arranque:', this.timeStarts.map(t => t.time).join(', '));
    }

    updateExpirationTime() {
        this.expiresAt = new Date(Date.now() + (this.hoursToLive * 60 * 60 * 1000));
        this.calculateTimeStarts();
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

    async reset() {
        if (this.mysqlService?.isConnected) {
            await this.mysqlService.limpiarRegistros();
        }
        
        this.startTimers.forEach(timer => clearTimeout(timer));
        this.startTimers = [];
        this.conexiones = 0;
        this.createdAt = null;
        this.expiresAt = null;
        this.timer = null;
        this.conexionesActivas.clear();
        this.timeStarts = [];
    }

    getStatus() {
        const now = new Date();
        return {
            conexiones: this.conexiones,
            createdAt: this.createdAt?.toLocaleString(),
            expiresAt: this.expiresAt?.toLocaleString(),
            currentTime: this.formatTimeShort(now),
            timeStarts: this.timeStarts.map(point => ({
                time: point.time,
                secondsUntilStart: Math.max(0, Math.round((point.timestamp - now.getTime()) / 1000))
            })),
            isActive: !!this.timer,
            conexion_mysql: !!this.mysqlService?.isConnected,
            intervalo: this.intervalo
        };
    }

    getTimeStarts() {
        const now = new Date();
        return {
            currentTime: this.formatTimeShort(now),
            timeStarts: this.timeStarts.map(point => ({
                time: point.time,
                secondsUntilStart: Math.max(0, Math.round((point.timestamp - now.getTime()) / 1000))
            }))
        };
    }
}

module.exports = AmbienteTimer;