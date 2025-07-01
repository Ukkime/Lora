// src/index.ts
import express, { Request, Response } from "express";
import cors from "cors";
import cardRoutes from "./routes/cardRoutes"; // Ya existente
import gameRoutes from "./routes/gameroutes";
import matchmakingRoutes from "./routes/matchmakingRoutes";
import http from 'http'; // NEW: Importar módulo HTTP
import { Server as SocketIOServer } from 'socket.io'; // NEW: Importar Server de Socket.IO
import { gameService } from './services/gameService'; // NEW: Importar gameService para acceder a la instancia de IO

const app = express();
const PORT = process.env.PORT || 3000;

// NEW: Crear un servidor HTTP a partir de la aplicación Express
const server = http.createServer(app);

// NEW: Configurar Socket.IO con el servidor HTTP
const io = new SocketIOServer(server, {
    cors: {
        origin: "*", // Permite cualquier origen para desarrollo. En producción, especifica tus dominios.
        methods: ["GET", "POST"]
    }
});

// NEW: Pasa la instancia de Socket.IO al gameService
// Esto permite que gameService emita eventos cuando una partida se encuentra.
gameService.setSocketIoInstance(io);

app.use(cors());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
    res.send('¡API de juego de cartas tipo Magic funcionando!');
});

app.use('/api/cards', cardRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/matchmaking', matchmakingRoutes);

// NEW: Escuchar conexiones de Socket.IO
io.on('connection', (socket) => {
    console.log(`Cliente conectado via Socket.IO: ${socket.id}`);

    // Cuando un cliente envía su playerId, asócialo al socket
    // Esto es crucial para poder enviarle mensajes específicos más tarde
    socket.on('registerPlayer', (playerId: string) => {
        console.log(`Socket ${socket.id} registrado para playerId: ${playerId}`);
        // Almacena el ID del socket asociado al jugador en gameService o un mapa separado
        gameService.registerPlayerSocket(playerId, socket.id);
    });

    socket.on('disconnect', () => {
        console.log(`Cliente desconectado via Socket.IO: ${socket.id}`);
        gameService.unregisterPlayerSocket(socket.id);
    });
});


// Cambiar app.listen a server.listen para que Socket.IO funcione
server.listen(PORT, () => {
    console.log(`Servidor API y Socket.IO escuchando en http://localhost:${PORT}`);
    console.log("¡API de juego de cartas lista para interactuar!");
});