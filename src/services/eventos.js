require('dotenv').config();
const moment = require('moment-timezone');
const fetch = require('node-fetch');

const TIMEZONE = 'America/Bogota';
moment.tz.setDefault(TIMEZONE);

class EventosService {
    constructor() {
        // Imprimir valores para debug (sin mostrar el token completo)
        console.log('Configuración Socket:');
        console.log('SOCKET_CANAL:', process.env.SOCKET_CANAL);
        console.log('SOCKET_URL:', process.env.SOCKET_URL);
        console.log('SOCKET_TOKEN está definido:', !!process.env.SOCKET_TOKEN);

        this.socketCanal = process.env.SOCKET_CANAL;
        this.socketToken = process.env.SOCKET_TOKEN;
        this.socketUrl = process.env.SOCKET_URL;

        // Construir URL completa
        if (this.socketUrl && !this.socketUrl.includes('/socket/enviar-mensaje')) {
            this.socketUrl = this.socketUrl.replace(/\/?$/, '/socket/enviar-mensaje');
        }
    }

    formatearFecha(fecha) {
        return moment(fecha).tz(TIMEZONE).format('YYYY-MM-DD_HH:mm');
    }

    async emitirEvento(param1, param2, fecha_bingo) {
        // Debug de variables
        console.log('Verificando configuración para emisión de evento:');
        console.log('Canal configurado:', !!this.socketCanal);
        console.log('Token configurado:', !!this.socketToken);
        console.log('URL configurada:', !!this.socketUrl);
        console.log('URL completa:', this.socketUrl);

        if (!this.socketCanal || !this.socketToken || !this.socketUrl) {
            console.error('Faltan variables de configuración:');
            console.error('- Canal:', !!this.socketCanal);
            console.error('- Token:', !!this.socketToken);
            console.error('- URL:', !!this.socketUrl);
            return false;
        }

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

            console.log(`Intentando enviar evento a: ${this.socketUrl}`);
            console.log('Datos del evento:', {
                ...data,
                token: '****' // Ocultar token en logs
            });

            const response = await fetch(this.socketUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const responseText = await response.text();
            console.log('Respuesta del servidor:', responseText);

            if (!response.ok) {
                throw new Error(`Error HTTP ${response.status}: ${responseText}`);
            }

            console.log('✅ Evento enviado exitosamente');
            return true;

        } catch (error) {
            console.error('❌ Error al emitir evento:', error.message);
            if (error.cause) {
                console.error('Causa:', error.cause);
            }
            return false;
        }
    }
}

module.exports = new EventosService();