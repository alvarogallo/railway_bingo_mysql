require('dotenv').config();
const moment = require('moment-timezone');
const fetch = require('node-fetch');

const TIMEZONE = 'America/Bogota';
moment.tz.setDefault(TIMEZONE);

class EventosService {
    constructor() {
        this.socketCanal = process.env.SOCKET_CANAL;
        this.socketToken = process.env.SOCKET_TOKEN;
        this.socketUrl = process.env.SOCKET_URL;

        // Asegurar URL completa con el endpoint correcto
        if (this.socketUrl) {
            // Asegurar que tenga https://
            if (!this.socketUrl.startsWith('http')) {
                this.socketUrl = `https://${this.socketUrl}`;
            }
            // Asegurar que termine en /socket/enviar-mensaje
            if (!this.socketUrl.endsWith('/socket/enviar-mensaje')) {
                this.socketUrl = `${this.socketUrl}/socket/enviar-mensaje`;
            }
        }

        console.log('Socket configurado:');
        console.log('- Canal:', this.socketCanal);
        console.log('- Endpoint:', this.socketUrl);
    }

    formatearFecha(fecha) {
        return moment(fecha).tz(TIMEZONE).format('YYYY-MM-DD_HH:mm');
    }

    async emitirEvento(param1, param2, fecha_bingo) {
        if (!this.socketCanal || !this.socketToken || !this.socketUrl) {
            console.error('No se puede emitir evento: faltan variables de configuración');
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

            console.log(`Enviando evento "${nombreEvento}" al canal "${this.socketCanal}"`);
            console.log('Data:', JSON.stringify(data, null, 2));

            const response = await fetch(this.socketUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const responseText = await response.text();
                throw new Error(`Error HTTP ${response.status}: ${responseText}`);
            }

            const responseData = await response.text();
            console.log('✅ Evento enviado exitosamente');
            console.log('Respuesta:', responseData);
            return true;

        } catch (error) {
            console.error('❌ Error al emitir evento:', error.message);
            return false;
        }
    }
}

module.exports = new EventosService();