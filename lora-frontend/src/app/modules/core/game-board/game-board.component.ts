import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Card } from '../../../models/card.model';
import { SocketService } from '../../../services/socket.service';
import { Subscription } from 'rxjs';
import { CardComponent } from "../../deck/card/card.component";

@Component({
  selector: 'app-game-board',
  standalone: true,
  imports: [CommonModule, CardComponent],
  templateUrl: './game-board.component.html',
  styleUrls: ['./game-board.component.css']
})
export class GameBoardComponent implements OnInit, OnDestroy {
  gameId: string | null = null;
  playerId: string = '';
  hand: Card[] = [];
  playZone: Card[] = [];
  // Ejemplo de otras propiedades de estado del juego
  life: number = 0;
  opponentLife: number = 0;
  opponentHandCount: number = 0;
  turn: string = '';
  phase: string = '';
  boardState: any = {};
  private subscriptions: Subscription[] = [];

  constructor(private route: ActivatedRoute, private socketService: SocketService) {}

  ngOnInit(): void {
    this.gameId = this.route.snapshot.paramMap.get('gameId');
    this.playerId = localStorage.getItem('playerId') || '';

    // Escucha actualizaciones de estado de la partida
    this.subscriptions.push(
      this.socketService.listen('gameStateUpdate').subscribe((gameState: any) => {
        console.log('[Socket] gameStateUpdate recibido:', gameState);
        if (!gameState) return;
        const ap = gameState.activePlayer;
        const nap = gameState.nonActivePlayer;
        const myId = this.playerId;
        if (ap && ap.id === myId) {
          this.hand = (ap.hand || []).map((c: any) => new Card(c));
          this.playZone = (ap.battlefield || []).map((c: any) => new Card(c));
          this.life = ap.life;
          this.opponentLife = nap?.life ?? 0;
          this.opponentHandCount = nap?.handSize ?? 0;
        } else if (nap && nap.id === myId) {
          this.hand = (nap.hand || []).map((c: any) => new Card(c));
          this.playZone = (nap.battlefield || []).map((c: any) => new Card(c));
          this.life = nap.life;
          this.opponentLife = ap?.life ?? 0;
          this.opponentHandCount = ap?.handSize ?? 0;
        } else {
          // fallback: limpia la mano y zona
          this.hand = [];
          this.playZone = [];
        }
        this.turn = gameState.turnNumber ? `${gameState.turnNumber}` : '';
        this.phase = gameState.currentPhase || '';
        this.boardState = gameState;
      })
    );

    // Solicita el estado inicial de la partida para este jugador
    if (this.gameId && this.playerId) {
      console.log('[Socket] Emit getGameStateForPlayer', { gameId: this.gameId, playerId: this.playerId });
      this.socketService.emit('getGameStateForPlayer', {
        gameId: this.gameId,
        playerId: this.playerId
      });
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  playCard(card: Card): void {
    console.log('[Socket] Emit playCard', { gameId: this.gameId, playerId: this.playerId, cardId: card.id });
    // Emitir evento para jugar carta (debería ser manejado por el backend y reflejado en el gameStateUpdate)
    if (this.gameId && this.playerId) {
      this.socketService.emit('playCard', {
        gameId: this.gameId,
        playerId: this.playerId,
        cardId: card.id
      });
    }
  }

  getManaColors(manaCost: any): string[] {
    return Object.keys(manaCost);
  }

  getManaCostValue(manaCost: any, color: string): number | undefined {
    return (manaCost as { [key: string]: number })[color];
  }
}

