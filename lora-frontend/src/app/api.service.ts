// src/app/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface Card {
  id: string;
  name: string;
  type: string;
  cost: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly BACKEND_URL = 'http://localhost:3000'; // Asegúrate de que coincida con el puerto de tu backend

  constructor(private http: HttpClient) { }

  getBackendMessage(): Observable<string> {
    return this.http.get(this.BACKEND_URL, { responseType: 'text' });
  }

  getCards(): Observable<Card[]> {
    return this.http.get<Card[]>(`${this.BACKEND_URL}/api/cards`);
  }

  startGame(player1Name: string, player2Name: string): Observable<any> {
    return this.http.post<any>(`${this.BACKEND_URL}/api/game/start`, { player1Name, player2Name });
  }

  // Otros métodos para interactuar con tu API de juego (ej. playCard, drawCard, etc.)
}
