// src/app/app.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { CommonModule } from '@angular/common'; // Needed for ngIf, ngFor
import { SocketService } from '../../../services/socket.service';
import { Card } from '../../../models/card.model'; // Import Card model and ManaCost
import { Subscription } from 'rxjs'; // To manage subscriptions
import {
  CardData,
  ManaCost,
  LoyaltyAbility,
} from '../../../interfaces/card-data.interface';
import { CardComponent } from "../card/card.component"; // Importa la interfaz CardData

@Component({
  selector: 'app-mercado',
  templateUrl: './market.component.html',
  styleUrls: ['./market.component.css'],
  standalone: true,
  imports: [CommonModule, CardComponent], // CommonModule for Angular directives
})
export class MercadoComponent implements OnInit, OnDestroy {
  title = 'Juego de Cartas (Frontend Angular)';
  backendMessage: string = '';

  // Existing card list (this will now be our 'availableCards')
  // We'll process it to add formattedManaCost
  allAvailableCards: Card[] = [];

  // Créditos del usuario
  userCredits: number = 0;

  // NEW: State for deck construction
  selectedDeck: Card[] = [];
  maxDeckSize: number = 20; // Example: Max deck size for testing (Magic is 60)
  minDeckSize: number = 15; // Example: Min deck size for testing

  isSocketConnected: boolean = false;
  playerId: string = 'playerABC' + Math.floor(Math.random() * 1000);
  playerName: string = 'AngularPlayer' + Math.floor(Math.random() * 1000);
  gameStatus: string = 'Inactivo. Pulsa "Unirse a Cola" para buscar partida.';
  currentActiveGameId: string | null = null;

  private subscriptions: Subscription[] = []; // To manage subscriptions

  constructor(
    private apiService: ApiService,
    private socketService: SocketService
  ) {}

  ngOnInit(): void {
    // Backend message (general health check)
    this.subscriptions.push(
      this.apiService.getBackendMessage().subscribe({
        next: (data) => (this.backendMessage = data),
        error: (err) => console.error('Error fetching backend message:', err),
      })
    );

    // Socket.IO connection and player registration
    this.subscriptions.push(
      this.socketService.onConnect$.subscribe(() => {
        this.isSocketConnected = true;
        console.log(
          'Socket.IO conectado. Registrando jugador con el backend...'
        );
        this.socketService.emit('registerPlayer', {
          playerId: this.playerId,
          playerName: this.playerName,
          socketId: this.socketService.getSocketId(),
        });
      })
    );

    // Subscribe to matchFound event from Socket.IO
    this.subscriptions.push(
      this.socketService.onMatchFound$.subscribe((matchData) => {
        this.currentActiveGameId = matchData.gameId;
        this.gameStatus = `¡Partida encontrada contra ${matchData.opponentName}! ID de partida: ${matchData.gameId}. Tu ID: ${matchData.yourPlayerId}`;
        console.log('Redirigiendo a la partida o actualizando UI...');
        alert(this.gameStatus); // Show alert
        // Here, you would typically redirect or switch to the actual game board component
        // For now, we just update the status message.
      })
    );

    // Subscribe to queue updates (e.g., leaving queue)
    this.subscriptions.push(
      this.socketService.onQueueUpdate$.subscribe((update) => {
        if (update.status === 'left') {
          this.gameStatus = update.message;
          alert(this.gameStatus);
        }
      })
    );

    // Cargar créditos del usuario
    this.subscriptions.push(
      this.apiService.getUserCredits().subscribe({
        next: (credits) => {
          this.userCredits = credits;
        },
        error: (err) => {
          console.error('No se pudieron obtener los créditos del usuario:', err);
        }
      })
    );

    // Fetch all available cards from the backend
    this.subscriptions.push(
      this.apiService.getCards().subscribe({
        next: (data) => {
          this.allAvailableCards = data.map((card) => ({
            ...card,
            formattedManaCost: this.formatManaCost(card.manaCost),
          }));
          console.log('Cartas disponibles cargadas:', this.allAvailableCards);
        },
        error: (err) => console.error('Error fetching cards:', err),
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  // Helper to format mana cost for display
  private formatManaCost(manaCost: ManaCost): string {
    let formatted = '';
    if (!manaCost) return '{0}';
    for (const color in manaCost) {
      if (
        manaCost.hasOwnProperty(color) &&
        manaCost[color as keyof ManaCost] !== undefined
      ) {
        formatted += `{${color}:${manaCost[color as keyof ManaCost]}}`;
      }
    }
    return formatted || '{0}';
  }

  // --- Compra de cartas ---
  buyCard(card: Card): void {
    if (card.available) {
      alert('¡Ya tienes esta carta!');
      return;
    }
    if (card.price && this.userCredits < card.price) {
      alert('No tienes suficientes créditos para comprar esta carta.');
      return;
    }
    this.apiService.buyCard(card.id).subscribe({
      next: (result) => {
        card.available = true;
        this.userCredits = result.credits;
        alert(`¡Has comprado la carta "${card.name}" por ${card.price ?? 10} créditos!`);
      },
      error: (err) => {
        alert(err.error?.message || 'No se pudo comprar la carta.');
      }
    });
  }

  // --- Deck Construction Logic ---

  addCardToDeck(card: Card): void {
    if (this.selectedDeck.length < this.maxDeckSize) {
      this.selectedDeck.push(card);
      console.log(
        `Added ${card.name} to deck. Deck size: ${this.selectedDeck.length}`
      );
    } else {
      alert(
        `El mazo ha alcanzado el tamaño máximo de ${this.maxDeckSize} cartas.`
      );
    }
  }

  removeCardFromDeck(card: Card): void {
    const index = this.selectedDeck.indexOf(card);
    if (index > -1) {
      this.selectedDeck.splice(index, 1);
      console.log(
        `Removed ${card.name} from deck. Deck size: ${this.selectedDeck.length}`
      );
    }
  }

  // --- API Interaction for Queue and Deck ---

  joinGameQueue(): void {
    const playerId = this.playerId; // Puedes generar un ID dinámico si es necesario
    const playerName = this.playerName;

    const socketId = this.socketService.getSocketId();
    if (!socketId) {
      alert('No hay conexión activa con el servidor de juego. Espera a que se conecte el Socket.IO antes de unirte a la cola.');
      return;
    }
    this.apiService.joinMatchmakingQueue(this.playerId, this.playerName, socketId).subscribe({
      next: (response) => {
        console.log('Unido a la cola de emparejamiento:', response);
        this.gameStatus = `En cola. Jugadores esperando: ${response.queueSize}`;
        alert(response.message);
        // Aquí puedes actualizar tu UI, por ejemplo, mostrando el tamaño de la cola
        // o deshabilitando el botón de unirse a la cola.
      },
      error: (error) => {
        console.error('Error al unirse a la cola:', error);
        this.gameStatus = `Error al unirse a la cola: ${
          error.error?.message || error.message
        }`;
        alert(`Error: ${error.error.message || 'No se pudo unir a la cola.'}`);
      },
    });
  }

  leaveGameQueue(): void {
    this.apiService.leaveQueue(this.playerId).subscribe({
      next: (response) => {
        this.gameStatus = `Has salido de la cola.`;
        console.log('Salido de la cola:', response);
        alert(this.gameStatus);
      },
      error: (error) => {
        this.gameStatus = `Error al salir de la cola: ${
          error.error?.message || error.message
        }`;
        console.error('Error al salir de la cola:', error);
        alert(this.gameStatus);
      },
    });
  }

  // This method is now obsolete as deck is sent with joinQueue
  // saveDeck(): void {
  //   const deckIds = this.selectedDeck.map(card => card.id);
  //   // You might have a specific API endpoint to save the deck to a user profile
  //   // For now, it's included with the joinGameQueue call.
  //   console.log('Deck saved/prepared for joining queue:', deckIds);
  //   alert('Mazo guardado/preparado para la cola.');
  // }
}
