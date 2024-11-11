require('dotenv').config();
const moment = require('moment-timezone');
const fetch = require('node-fetch');

const TIMEZONE = 'America/Bogota';
moment.tz.setDefault(TIMEZONE);

// Configuración correcta verificada
const DEFAULT_CONFIG = {
    canal: 'Bingo_Automatico',
    token: 'bingo_automatico',
    baseUrl: 'https://railwaynodemysql-production-ba44.up.railway.app/enviar-mensaje'  // Ruta verificada
};

class EventosService {
    constructor() {
        this.socketCanal = process.env.SOCKET_CANAL_V2 || DEFAULT_CONFIG.canal;
        this.socketToken = process.env.SOCKET_TOKEN_V2 || DEFAULT_CONFIG.token;
        this.socketUrl = process.env.SOCKET_URL_V2 || DEFAULT_CONFIG.baseUrl;

        console.log('Socket configurado:');
        console.log('Canal:', this.socketCanal);
        console.log('URL:', this.socketUrl);
    }

    async emitirEvento(param1, param2, fecha_bingo) {
        try {
            const fechaFormateada = this.formatearFecha(fecha_bingo);
            const nombreEvento = 'Bingo_empieza';

            const data = {
                canal: this.socketCanal,
                token: this.socketToken,
                evento: nombreEvento,
                mensaje: {
                    fecha_bingo: fechaFormateada,
                    param1: param1,
                    param2: param2,
                    timestamp: moment().tz(TIMEZONE).format('YYYY-MM-DD HH:mm:ss'),
                    zonaHoraria: TIMEZONE
                }
            };

            const response = await fetch(this.socketUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const responseData = await response.json();

            if (response.ok) {
                console.log('✅ Evento enviado:', responseData.mensaje);
                return true;
            } else {
                throw new Error(`Error: ${responseData.mensaje || 'Error desconocido'}`);
            }

        } catch (error) {
            console.error('❌ Error al emitir evento:', error.message);
            return false;
        }
    }

    formatearFecha(fecha) {
        return moment(fecha).tz(TIMEZONE).format('YYYY-MM-DD_HH:mm');
    }
}

module.exports = new EventosService();