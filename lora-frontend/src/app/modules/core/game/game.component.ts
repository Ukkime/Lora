import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { SocketService } from '../../../services/socket.service';
import { Subscription } from 'rxjs';
import { Card } from '../../../models/card.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css'],
})
export class GameComponent implements OnInit, OnDestroy {
  gameStatus: string = 'Inactivo. Pulsa "Unirse a Cola" para buscar partida.';
  isSocketConnected: boolean = false;
  socketId: string | undefined = undefined;
  currentActiveGameId: string | null = null;
  playerId: string; // Se inicializará en ngOnInit
  playerName: string; // Se inicializará en ngOnInit
  userDecks: any[] = [];
  selectedDeckId: number | null | undefined = null;
  selectedDeck: Card[] = [];
  minDeckSize: number = 15;
  maxDeckSize: number = 60;
  message: string | null = null; // Para mostrar mensajes en la UI

  private subscriptions: Subscription[] = [];

  constructor(
    private apiService: ApiService,
    private socketService: SocketService,
    private router: Router
  ) {
    // Inicializa playerId y playerName desde localStorage o genera nuevos
    this.playerId =
      localStorage.getItem('playerId') ||
      'player' + Math.floor(Math.random() * 10000);
    this.playerName =
      localStorage.getItem('playerName') ||
      'Jugador' + Math.floor(Math.random() * 10000);

    // Guarda los valores en localStorage si son nuevos
    localStorage.setItem('playerId', this.playerId);
    localStorage.setItem('playerName', this.playerName);
  }

  ngOnInit(): void {
    console.log(
      '[GameComponent] Player ID:',
      this.playerId,
      'Player Name:',
      this.playerName
    );

    // Cargar mazos del usuario
    this.subscriptions.push(
      this.apiService.getDecks().subscribe({
        next: (decks) => {
          this.userDecks = decks;
          if (decks.length > 0) {
            // Intenta seleccionar el mazo previamente elegido o el primero
            const storedDeckId = localStorage.getItem('selectedDeckId');
            const initialDeck = storedDeckId
              ? decks.find((d) => d.id === parseInt(storedDeckId))
              : decks[0];
            if (initialDeck) {
              this.selectedDeckId = initialDeck.id;
              this.selectedDeck = initialDeck.cards;
            } else {
              this.selectedDeckId = decks[0].id;
              this.selectedDeck = decks[0].cards;
            }
          }
        },
        error: (err) => {
          console.error('No se pudieron obtener los mazos del usuario:', err);
          this.showMessage(
            'Error al cargar mazos. Inténtalo de nuevo más tarde.',
            'error'
          );
        },
      })
    );

    // Estado inmediato del socket
    this.socketId = this.socketService.getSocketId();
    console.log('[SOCKET] Estado del socket (inicial):', this.socketId);
    this.isSocketConnected = !!this.socketId;

    // Conexión de socket
    this.subscriptions.push(
      this.socketService.onConnect$.subscribe(() => {
        this.isSocketConnected = true;
        this.socketId = this.socketService.getSocketId();
        console.log('[SOCKET] Conectado. SocketId:', this.socketId);
        // Asegúrate de registrar al jugador cada vez que el socket se conecta (o reconecta)
        this.registerPlayerWithBackend();
        this.showMessage('Conectado al servidor de juego.', 'success');
      })
    );

    // Desconexión de socket
    this.subscriptions.push(
      this.socketService.onDisconnect$.subscribe(() => {
        this.isSocketConnected = false;
        this.socketId = undefined;
        console.warn('Socket.IO desconectado.');
        this.showMessage('Desconectado del servidor de juego.', 'error');
      })
    );

    // Matchmaking
    this.subscriptions.push(
      this.socketService.onMatchFound$.subscribe((matchData) => {
        this.currentActiveGameId = matchData.gameId;
        this.gameStatus = `¡Partida encontrada contra ${matchData.opponentName}! ID de partida: ${matchData.gameId}`;
        this.showMessage(this.gameStatus, 'success');
        this.router.navigate(['/tablero/' + matchData.gameId]);
      })
    );

    // Cola
    this.subscriptions.push(
      this.socketService.onQueueUpdate$.subscribe((update) => {
        if (update.status === 'left') {
          this.gameStatus = update.message;
          this.showMessage(this.gameStatus, 'info');
        } else if (update.status === 'joined') {
          this.gameStatus = update.message;
          this.showMessage(this.gameStatus, 'info');
        }
      })
    );

    // Si ya está conectado al iniciar, registrar al jugador
    if (this.isSocketConnected) {
      this.registerPlayerWithBackend();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    // Opcional: limpiar playerId/playerName de localStorage si la sesión debe ser efímera
    // localStorage.removeItem('playerId');
    // localStorage.removeItem('playerName');
    // localStorage.removeItem('selectedDeckId');
  }

  private registerPlayerWithBackend(): void {
    if (this.socketId) {
      this.socketService.emit('registerPlayer', {
        playerId: this.playerId,
        playerName: this.playerName,
        socketId: this.socketId,
      });
      console.log('[SOCKET] Registro enviado al backend:', {
        playerId: this.playerId,
        playerName: this.playerName,
        socketId: this.socketId,
      });
    } else {
      console.warn('[SOCKET] No se pudo registrar: SocketId no disponible.');
    }
  }

  onDeckChange(event: any): void {
    const deckId = parseInt(event.target.value, 10); // Asegurarse de que es un número
    const found = this.userDecks.find((d) => d.id === deckId);
    if (found) {
      this.selectedDeckId = found.id;
      this.selectedDeck = found.cards;
      localStorage.setItem('selectedDeckId', String(found.id)); // Guardar selección de mazo
    }
  }

  joinGameQueue(): void {
    this.message = null; // Limpiar mensajes anteriores
    if (
      !this.selectedDeck ||
      this.selectedDeck.length < this.minDeckSize ||
      this.selectedDeck.length > this.maxDeckSize
    ) {
      this.showMessage(
        `El mazo seleccionado no tiene el tamaño correcto. Debe tener entre ${this.minDeckSize} y ${this.maxDeckSize} cartas.`,
        'error'
      );
      return;
    }
    const socketId = this.socketService.getSocketId();
    console.log('[SOCKET] Intentando unirse a la cola con socketId:', socketId);
    if (!socketId) {
      this.showMessage(
        'No hay conexión activa con el servidor de juego. Espera a que se conecte el Socket.IO antes de unirte a la cola.',
        'error'
      );
      return;
    }
    this.apiService
      .joinMatchmakingQueue(this.playerId, this.playerName, socketId)
      .subscribe({
        next: (response) => {
          console.log('Unido a la cola de emparejamiento:', response);
          this.gameStatus = `En cola. Jugadores esperando: ${response.queueSize}`;
          this.showMessage(
            response.message || 'Te has unido a la cola de emparejamiento.',
            'success'
          );
        },
        error: (error) => {
          console.error('Error al unirse a la cola:', error);
          this.gameStatus = `Error al unirse a la cola: ${
            error.error?.message || error.message
          }`;
          this.showMessage(
            `Error: ${error.error?.message || 'No se pudo unir a la cola.'}`,
            'error'
          );
        },
      });
  }

  leaveGameQueue(): void {
    this.message = null; // Limpiar mensajes anteriores
    const socketId = this.socketService.getSocketId();
    if (socketId) {
      this.socketService.emit('leaveQueue', {
        playerId: this.playerId,
        socketId,
      });
      this.gameStatus = 'Has salido de la cola.';
      this.showMessage('Has salido de la cola de emparejamiento.', 'info');
    } else {
      this.showMessage(
        'No estás conectado al servidor de juego para salir de la cola.',
        'warning'
      );
    }
  }

  showMessage(
    msg: string,
    type: 'success' | 'error' | 'info' | 'warning'
  ): void {
    this.message = msg;
    // Opcional: ocultar el mensaje después de un tiempo
    setTimeout(() => {
      this.message = null;
    }, 5000); // El mensaje desaparece después de 5 segundos
  }
}
