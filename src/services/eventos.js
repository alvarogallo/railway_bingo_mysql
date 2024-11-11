require('dotenv').config();
const moment = require('moment-timezone');
const fetch = require('node-fetch');

const TIMEZONE = 'America/Bogota';
moment.tz.setDefault(TIMEZONE);

class EventosService {
    constructor() {
        this.socketCanal = process.env.SOCKET_CANAL;
        this.socketToken = process.env.SOCKET_TOKEN;
        // Asegurar que la URL tenga el protocolo
        this.socketUrl = process.env.SOCKET_URL.startsWith('http') 
            ? process.env.SOCKET_URL 
            : `https://${process.env.SOCKET_URL}`;
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