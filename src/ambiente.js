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
        this.timeZone = 'America/Bogota';
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

    getBogotaTime(date = new Date()) {
        return new Date(date.toLocaleString('en-US', { timeZone: this.timeZone }));
    }

    formatToBogotaTime(date) {
        if (!date) return null;
        return date.toLocaleString('es-CO', { 
            timeZone: this.timeZone,
            hour12: false
        });
    }

    formatToBogotaTimeShort(date) {
        if (!date) return null;
        return date.toLocaleTimeString('es-CO', { 
            timeZone: this.timeZone,
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
        const now = this.getBogotaTime();
        const minutes = now.getMinutes();
        const hours = now.getHours();

        // Limpiar timers anteriores
        this.startTimers.forEach(timer => clearTimeout(timer));
        this.startTimers = [];

        // Calcular próximos puntos de inicio
        let nextPoints = [];
        let firstPointMinutes = Math.ceil(minutes / this.intervalo) * this.intervalo;
        let firstPointHours = hours;

        // Ajustar si los minutos pasan a la siguiente hora
        if (firstPointMinutes >= 60) {
            firstPointMinutes = 0;
            firstPointHours += 1;
        }

        // Primer punto
        let firstPoint = new Date(now);
        firstPoint.setHours(firstPointHours, firstPointMinutes, 0, 0);

        // Segundo punto
        let secondPoint = new Date(firstPoint);
        if (firstPointMinutes + this.intervalo >= 60) {
            secondPoint.setHours(firstPointHours + 1, 0, 0, 0);
        } else {
            secondPoint.setMinutes(firstPointMinutes + this.intervalo);
        }

        nextPoints = [firstPoint, secondPoint];

        // Actualizar timeStarts
        this.timeStarts = nextPoints.map(date => ({
            time: this.formatToBogotaTimeShort(date),
            timestamp: date.getTime()
        }));

        // Configurar los timers
        this.timeStarts.forEach(point => {
            const timeUntilStart = point.timestamp - now.getTime();
            if (timeUntilStart > 0) {
                const timer = setTimeout(async () => {
                    console.log('\x1b[32m%s\x1b[0m', `=== HORA DE ARRANCAR (${point.time}) ===`);
                    if (this.mysqlService?.isConnected) {
                        await this.mysqlService.registrarTimeStart(new Date(point.timestamp));
                    }
                }, timeUntilStart);
                this.startTimers.push(timer);
            }
        });

        console.log(`Puntos de arranque calculados con intervalo de ${this.intervalo} minutos:`, 
            this.timeStarts.map(t => t.time));
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
        const now = this.getBogotaTime();
        return {
            conexiones: this.conexiones,
            createdAt: this.formatToBogotaTime(this.createdAt),
            expiresAt: this.formatToBogotaTime(this.expiresAt),
            currentTime: this.formatToBogotaTimeShort(now),
            timeStarts: this.timeStarts.map(point => ({
                time: point.time,
                secondsUntilStart: Math.max(0, Math.round((point.timestamp - now.getTime()) / 1000))
            })),
            isActive: !!this.timer,
            conexion_mysql: !!this.mysqlService?.isConnected,
            intervalo: this.intervalo,
            timeZone: this.timeZone
        };
    }

    getTimeStarts() {
        const now = this.getBogotaTime();
        return {
            currentTime: this.formatToBogotaTimeShort(now),
            timeStarts: this.timeStarts.map(point => ({
                time: point.time,
                secondsUntilStart: Math.max(0, Math.round((point.timestamp - now.getTime()) / 1000))
            }))
        };
    }
}

module.exports = AmbienteTimer;