// src/index.ts
import express, { Request, Response } from "express";
import cors from "cors";
import cardRoutes from "./routes/cardRoutes"; // Ya existente
import cardShopRoutes from "./routes/cardShopRoutes";
import userRoutes from "./routes/userRoutes";
import deckRoutes from "./routes/deckRoutes";
import { authenticateToken } from "./middleware/authMiddleware";
import gameRoutes from "./routes/gameroutes";
import matchmakingRoutes from "./routes/matchmakingRoutes";
import http from 'http'; // NEW: Importar módulo HTTP
import { Server as SocketIOServer } from 'socket.io'; // NEW: Importar Server de Socket.IO
import { gameService } from './services/gameService'; // NEW: Importar gameService para acceder a la instancia de IO
import authRoutes from './routes/authRoutes'; // NEW: Importar rutas de autenticación

import { initializeDatabase } from "./db";

// load config './config/dev.env'
require("dotenv").config({ path: __dirname + "/config/dev.env" });

let secret = process.env.SECRET as string;

console.log(secret);

initializeDatabase();

const app = express();
const PORT = process.env.PORT || 3000;

// --- CORS CONFIG CORRECTO ---
app.use(cors({
    origin: 'http://localhost:4200',
    credentials: false, // Cambia a true solo si usas cookies
    allowedHeaders: ['Authorization', 'Content-Type'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));
app.use(express.json());

// Montar rutas de compra de cartas
app.use("/api/cards", authenticateToken, cardShopRoutes);
// Montar rutas de usuario
app.use("/api/users", authenticateToken, userRoutes);
// Montar rutas de mazos
app.use("/api/decks", deckRoutes);

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


app.get('/', (req: Request, res: Response) => {
    res.send('¡API de juego de cartas tipo Magic funcionando!');
});

app.use('/api/cards', cardRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/matchmaking', matchmakingRoutes);
app.use("/api/auth", authRoutes);

// NEW: Escuchar conexiones de Socket.IO
io.on('connection', (socket) => {
    console.log(`Cliente conectado via Socket.IO: ${socket.id}`);

    // Cuando un cliente envía su playerId, asócialo al socket
    // Esto es crucial para poder enviarle mensajes específicos más tarde
    socket.on("registerPlayer", ({ playerId, playerName }) => {
        console.log(
            `Recibido evento registerPlayer para ID: ${playerId}, Nombre: ${playerName}, Socket: ${socket.id}`
        );
        // Now call gameService to associate the playerId with the socketId
        gameService.registerPlayerSocket(playerId, socket.id);
        // Optional: Send a confirmation back to the client
        socket.emit("playerRegistered", {
            success: true,
            playerId,
            socketId: socket.id,
        });
    });

    socket.on('leaveQueue', (data) => {
        const { playerId } = data;
        console.log(`[SOCKET] Recibido leaveQueue para playerId: ${playerId}, socket: ${socket.id}`);
        if (playerId) {
            const result = gameService.leaveQueue(playerId);
            if (!result) {
                console.warn(`[SOCKET] El jugador ${playerId} no estaba en la cola o ya había salido.`);
            }
        } else {
            console.warn('[SOCKET] leaveQueue recibido sin playerId.');
        }
    });

    // NUEVO: Handler para recuperar el estado de la partida para el jugador
    socket.on('getGameStateForPlayer', ({ gameId, playerId }) => {
        console.log('[SOCKET] getGameStateForPlayer recibido:', gameId, playerId);
        try {
            const gameState = gameService.getGameStateForPlayer(gameId, playerId);
            socket.emit('gameStateUpdate', gameState);
        } catch (err) {
            console.error('[SOCKET] Error al obtener gameState:', err);
            socket.emit('gameStateUpdate', { error: 'No se pudo recuperar el estado de la partida.' });
        }
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