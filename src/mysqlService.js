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
        this.intervalo = 30; // Valor por defecto
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

    calculateTimeStarts() {
        const now = new Date();
        let nextPoints = [];
        
        // Calcular próximos puntos basados en el intervalo
        const minutes = now.getMinutes();
        const currentInterval = Math.floor(minutes / this.intervalo);
        const nextInterval = (currentInterval + 1) * this.intervalo;

        // Primer punto
        let firstPoint = new Date(now);
        firstPoint.setMinutes(nextInterval, 0, 0);
        
        // Segundo punto
        let secondPoint = new Date(firstPoint);
        secondPoint.setMinutes(nextInterval + this.intervalo, 0, 0);

        if (secondPoint.getMinutes() >= 60) {
            secondPoint.setHours(secondPoint.getHours() + 1);
            secondPoint.setMinutes(secondPoint.getMinutes() - 60);
        }

        nextPoints = [firstPoint, secondPoint];

        // Limpiar timers anteriores
        this.startTimers.forEach(timer => clearTimeout(timer));
        this.startTimers = [];

        this.timeStarts = nextPoints.map(date => ({
            time: date.toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit' 
            }),
            timestamp: date.getTime()
        }));

        // Configurar nuevos timers
        this.timeStarts.forEach(async point => {
            const timeUntilStart = point.timestamp - Date.now();
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

        console.log(`Puntos de arranque calculados con intervalo de ${this.intervalo} minutos:`, this.timeStarts);
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
            conexion_mysql: !!this.mysqlService?.isConnected,
            intervalo: this.intervalo
        };
    }

    // ... otros métodos permanecen igual ...
}

module.exports = AmbienteTimer;