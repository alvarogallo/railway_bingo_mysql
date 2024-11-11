require('dotenv').config();
const express = require('express');
const EventosService = require('./services/eventos');
const moment = require('moment-timezone');

const app = express();
const port = process.env.PORT || 3000;

async function testSocket() {
    console.log('=== TEST DE SOCKET ===');
    console.log('Hora actual:', moment().format('YYYY-MM-DD HH:mm:ss'));
    
    try {
        // Simular un punto de arranque (hora actual + 1 minuto)
        const fechaBingo = new Date(Date.now() + 60000);
        
        console.log('\nIntentando enviar evento de prueba...');
        const resultado = await EventosService.emitirEvento(
            'Bingo',
            'Inicia',
            fechaBingo
        );

        if (resultado) {
            console.log('\n✅ Test completado exitosamente');
        } else {
            console.log('\n❌ Test falló');
        }
        
    } catch (error) {
        console.error('\n❌ Error en el test:', error);
    }
}

// Iniciar servidor y ejecutar test
app.listen(port, async () => {
    console.log(`Servidor iniciado en puerto ${port}`);
    console.log('Ejecutando test de socket...');
    await testSocket();
    console.log('\nServidor mantenido activo...');
});

// Ruta básica para mantener el servidor vivo
app.get('/', (req, res) => {
    res.send('Test server running');
});