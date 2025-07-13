// src/app/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { SocketService } from './socket.service'; // Import your SocketService
import { Card } from '../models/card.model'; // Importa la CLASE Card
import { Deck } from '../models/deck.model';
import { CardData, ManaCost } from '../interfaces/card-data.interface'; // Importa la INTERFAZ CardData


@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly BACKEND_URL = 'http://localhost:3000'; // Asegúrate de que coincida con el puerto de tu backend

  constructor(
    private http: HttpClient,
    private socketService: SocketService // Inject SocketService
  ) {}

  getBackendMessage(): Observable<string> {
    return this.http.get(this.BACKEND_URL, { responseType: 'text' });
  }

  buyCard(cardId: string): Observable<any> {
    return this.http.post<any>(`${this.BACKEND_URL}/api/cards/buy`, { cardId });
  }

  getUserCredits(): Observable<number> {
    return this.http
      .get<{ credits: number }>(`${this.BACKEND_URL}/api/users/me/credits`)
      .pipe(map((res) => res.credits));
  }

  getCards(): Observable<Card[]> {
    // 1. Fetch data as CardData[] (raw data from backend)
    return this.http.get<CardData[]>(`${this.BACKEND_URL}/api/cards`).pipe(
      // 2. Use the 'map' operator to transform each CardData object
      map((cardDataArray: CardData[]) =>
        cardDataArray.map((data: CardData) => {
          // 3. Create a new object that conforms to the 'Card' interface
          //    (which extends CardData and adds formattedManaCost)
          return {
            ...data, // Copy all properties from CardData
            formattedManaCost: this.formatManaCost(data.manaCost), // Calculate and add formattedManaCost
          } as Card; // Explicitly cast to Card interface
        })
      )
    );
  }

  // --- Deck API ---
  getDecks(): Observable<Deck[]> {
    return this.http.get<Deck[]>(`${this.BACKEND_URL}/api/decks`);
  }

  getDeckById(id: number): Observable<Deck> {
    return this.http.get<Deck>(`${this.BACKEND_URL}/api/decks/${id}`);
  }

  createCard(card: CardData): Observable<any> {
    return this.http.post<any>(`${this.BACKEND_URL}/api/cards`, card);
  }

  createDeck(deck: { name: string; cards: string[] }): Observable<Deck> {
    return this.http.post<Deck>(`${this.BACKEND_URL}/api/decks`, deck);
  }

  updateDeck(
    id: number,
    deck: { name: string; cards: string[] }
  ): Observable<Deck> {
    return this.http.put<Deck>(`${this.BACKEND_URL}/api/decks/${id}`, deck);
  }

  deleteDeck(id: number): Observable<any> {
    return this.http.delete(`${this.BACKEND_URL}/api/decks/${id}`);
  }

  // --- Helper method to format mana cost (move from component if only used here) ---
  private formatManaCost(manaCost: ManaCost): string {
    const costParts: string[] = [];
    // Define a consistent order for mana types for display
    const manaOrder: (keyof ManaCost)[] = ['C', 'W', 'U', 'B', 'R', 'G'];

    if (!manaCost) return '{0}';

    for (const type of manaOrder) {
      if (manaCost[type] !== undefined && manaCost[type]! > 0) {
        costParts.push(`${manaCost[type]}${type}`);
      }
    }

    // Special handling for lands that have no explicit mana cost, but are considered 0 cost
    if (costParts.length === 0) {
      return '{0}';
    }

    return costParts.join(''); // Joins parts, e.g., "1C1G"
  }

  startGame(player1Name: string, player2Name: string): Observable<any> {
    return this.http.post<any>(`${this.BACKEND_URL}/api/game/start`, {
      player1Name,
      player2Name,
    });
  }
  /**
   * Envía una solicitud para que un jugador se una a la cola de emparejamiento,
   * incluyendo el ID de la conexión Socket.IO.
   * @param playerId El ID único del jugador.
   * @param playerName El nombre del jugador.
   * @param socketId El ID de la conexión Socket.IO.
   * @returns Un Observable que emite la respuesta del backend.
   */
  joinMatchmakingQueue(
    playerId: string,
    playerName: string,
    socketId: string
  ): Observable<any> {
    return this.http.post<any>(`${this.BACKEND_URL}/api/matchmaking/join`, {
      playerId,
      playerName,
      socketId, // Ahora es obligatorio
    });
  }

  leaveQueue(playerId: string): Observable<any> {
    return this.http.post(`${this.BACKEND_URL}/api/matchmaking/leave`, {
      playerId,
    });
  }

  getQueueStatus(): Observable<any> {
    return this.http.get(`${this.BACKEND_URL}/api/matchmaking/status`);
  }
  // Otros métodos para interactuar con tu API de juego (ej. playCard, drawCard, etc.)
}
