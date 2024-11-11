class AmbienteTimer {
    constructor() {
        this.conexiones = 0;
        this.createdAt = null;
        this.expiresAt = null;
        this.timer = null;
        this.hoursToLive = 1;
        this.conexionesActivas = new Set();
        this.timeStarts = [];
        this.startTimers = [];  // Para guardar los timers de los puntos de arranque
    }

    initialize(ip) {
        if (!this.createdAt) {
            this.createdAt = new Date();
            this.conexiones = 1;
            this.conexionesActivas.add(ip);
            this.updateExpirationTime();
            this.calculateTimeStarts();
            this.setTimer();
            console.log(`Primera conexión desde ${ip}. Ambiente inicializado.`);
        }
    }

    setStartTimeAlerts() {
        // Limpiar timers anteriores
        this.startTimers.forEach(timer => clearTimeout(timer));
        this.startTimers = [];

        // Configurar nuevos timers para cada punto de arranque
        this.timeStarts.forEach(point => {
            const now = Date.now();
            const timeUntilStart = point.timestamp - now;
            
            if (timeUntilStart > 0) {
                const timer = setTimeout(() => {
                    console.log('\x1b[32m%s\x1b[0m', `=== HORA DE ARRANCAR (${point.time}) ===`);
                }, timeUntilStart);
                
                this.startTimers.push(timer);
                console.log(`Alerta programada para: ${point.time} (en ${Math.round(timeUntilStart/1000)} segundos)`);
            }
        });
    }

    calculateTimeStarts() {
        const now = new Date();
        const currentMinutes = now.getMinutes();
        const currentHour = now.getHours();
        
        // Limpiar puntos anteriores
        this.timeStarts = [];
        
        // Calcular próximos puntos de arranque
        let nextPoints = [];
        
        // Encontrar próximos puntos en la hora actual y siguiente
        for (let hour = currentHour; hour <= currentHour + 1; hour++) {
            for (let minutes of [0, 30]) {
                let pointTime = new Date(now);
                pointTime.setHours(hour, minutes, 0, 0);
                
                // Solo agregar puntos futuros
                if (pointTime > now) {
                    nextPoints.push(pointTime);
                }
            }
        }

        // Ordenar puntos por tiempo y tomar los dos primeros
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

        // Configurar las alertas para los nuevos puntos
        this.setStartTimeAlerts();

        console.log('Puntos de arranque calculados:', this.timeStarts);
    }

    updateExpirationTime() {
        this.expiresAt = new Date(Date.now() + (this.hoursToLive * 60 * 60 * 1000));
        // Recalcular puntos de arranque cuando se extiende el tiempo
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

    reset() {
        // Limpiar los timers de puntos de arranque
        this.startTimers.forEach(timer => clearTimeout(timer));
        this.startTimers = [];
        
        this.conexiones = 0;
        this.createdAt = null;
        this.expiresAt = null;
        this.timer = null;
        this.conexionesActivas.clear();
        this.timeStarts = [];
    }

    addConexion(ip) {
        if (!this.conexionesActivas.has(ip)) {
            this.conexiones += 1;
            this.conexionesActivas.add(ip);
            this.updateExpirationTime();
            this.setTimer();
            console.log(`Nueva conexión desde ${ip}. Total conexiones: ${this.conexiones}`);
        } else {
            console.log(`Conexión existente desde ${ip}. Extendiendo tiempo.`);
            this.updateExpirationTime();
            this.setTimer();
        }
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
            isActive: !!this.timer
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