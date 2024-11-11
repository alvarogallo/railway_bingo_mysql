require('dotenv').config();
const moment = require('moment-timezone');
const fetch = require('node-fetch');

const TIMEZONE = 'America/Bogota';
moment.tz.setDefault(TIMEZONE);

class EventosService {
    constructor() {
        // Verificar y asignar valores con fallbacks
        if (!process.env.SOCKET_CANAL || !process.env.SOCKET_TOKEN || !process.env.SOCKET_URL) {
            console.log('⚠️ Variables de entorno de Socket no configuradas');
        }

        this.socketCanal = process.env.SOCKET_CANAL || 'Bingo_Automatico';
        this.socketToken = process.env.SOCKET_TOKEN || 'bingo_automatico';
        this.socketUrl = process.env.SOCKET_URL || 'https://railwaynodemysql-production-ba44.up.railway.app';

        // Asegurar que la URL tenga el protocolo
        if (!this.socketUrl.startsWith('http')) {
            this.socketUrl = `https://${this.socketUrl}`;
        }

        console.log('Socket configurado con:');
        console.log('- Canal:', this.socketCanal);
        console.log('- URL:', this.socketUrl);
    }

    formatearFecha(fecha) {
        return moment(fecha).tz(TIMEZONE).format('YYYY-MM-DD_HH:mm');
    }

    async emitirEvento(param1, param2, fecha_bingo) {
        try {
            const fechaFormateada = this.formatearFecha(fecha_bingo);
            const nombreEvento = 'Bingo_empieza';

            const mensaje = {
                fecha_bingo: fechaFormateada,
                param1: param1,
                param2: param2,
                timestamp: moment().tz(TIMEZONE).format('YYYY-MM-DD HH:mm:ss'),
                zonaHoraria: TIMEZONE
            };

            const data = {
                canal: this.socketCanal,
                token: this.socketToken,
                evento: nombreEvento,
                mensaje: mensaje
            };

            console.log(`Enviando evento a: ${this.socketUrl}`);
            console.log(`Evento: ${nombreEvento}`);
            console.log('Data:', JSON.stringify(data, null, 2));

            const response = await fetch(this.socketUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const httpCode = response.status;
            if (httpCode !== 200) {
                throw new Error(`Error HTTP: ${httpCode}`);
            }

            const responseData = await response.text();
            console.log('Respuesta:', responseData);
            return true;

        } catch (error) {
            console.error('Error al emitir evento:', error.message);
            console.error('URL utilizada:', this.socketUrl);
            return false;
        }
    }
}

module.exports = new EventosService();