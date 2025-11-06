require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/database');
const { initializeSocket } = require('./src/config/socket');

// Conectar a la base de datos
connectDB();

// Crear servidor HTTP
const server = http.createServer(app);

// Inicializar Socket.io
const io = initializeSocket(server);

// Puerto
const PORT = process.env.PORT || 3000;

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`

  Servidor iniciado correctamente      
                                            
   Puerto: ${PORT}                      
   Entorno: ${process.env.NODE_ENV || 'development'}           
   URL: http://localhost:${PORT}              
   WebSocket: Activo                     
   MongoDB: Conectado                  
  `);
});

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
  console.error('Error no manejado:', err.message);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  console.error('Excepción no capturada:', err.message);
  process.exit(1);
});

// Manejo de señales de terminación
process.on('SIGTERM', () => {
  console.log('SIGTERM recibido. Cerrando servidor...');
  server.close(() => {
    console.log('Servidor cerrado correctamente');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT recibido. Cerrando servidor...');
  server.close(() => {
    console.log('Servidor cerrado correctamente');
    process.exit(0);
  });
});