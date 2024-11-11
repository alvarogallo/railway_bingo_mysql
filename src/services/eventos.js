require('dotenv').config();
const moment = require('moment-timezone');
const fetch = require('node-fetch');

const TIMEZONE = 'America/Bogota';
moment.tz.setDefault(TIMEZONE);

const DEFAULT_CONFIG = {
    canal: 'Bingo_Automatico',
    token: 'bingo_automatico',
    url: 'https://railwaynodemysql-production-ba44.up.railway.app'
};

class EventosService {
    constructor() {
        // Usar V2 o valores por defecto
        this.socketCanal = process.env.SOCKET_CANAL_V2 || DEFAULT_CONFIG.canal;
        this.socketToken = process.env.SOCKET_TOKEN_V2 || DEFAULT_CONFIG.token;
        this.socketUrl = process.env.SOCKET_URL_V2 || DEFAULT_CONFIG.url;

        // Imprimir configuración
        console.log('Configuración Socket:');
        console.log('Canal:', this.socketCanal, 
            process.env.SOCKET_CANAL_V2 ? '(desde ENV)' : '(valor por defecto)');
        console.log('URL:', this.socketUrl,
            process.env.SOCKET_URL_V2 ? '(desde ENV)' : '(valor por defecto)');
        console.log('Token configurado:', !!this.socketToken,
            process.env.SOCKET_TOKEN_V2 ? '(desde ENV)' : '(valor por defecto)');

        // Asegurar URL completa
        if (this.socketUrl && !this.socketUrl.includes('/socket/enviar-mensaje')) {
            this.socketUrl = this.socketUrl.replace(/\/?$/, '/socket/enviar-mensaje');
        }

        console.log('✅ Socket configurado exitosamente');
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