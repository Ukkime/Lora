// src/app/app.component.ts
import { Component, OnInit } from '@angular/core';
import { ApiService } from './api.service'; // Importa tu servicio
import { CommonModule } from '@angular/common';

interface Card {
  id: string;
  name: string;
  type: string;
  cost: string;
  description: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [CommonModule],
})
export class AppComponent implements OnInit {
  title = 'Juego de Cartas (Frontend Angular)';
  backendMessage: string = '';
  cards: Card[] = [];

  constructor(private apiService: ApiService) {} // Inyecta el servicio

  ngOnInit(): void {
    // Suscribirse al mensaje del backend
    this.apiService.getBackendMessage().subscribe({
      next: (data) => (this.backendMessage = data),
      error: (err) => console.error('Error fetching message:', err),
    });

    // Suscribirse a la lista de cartas
    this.apiService.getCards().subscribe({
      next: (data) => (this.cards = data),
      error: (err) => console.error('Error fetching cards:', err),
    });
  }

  startGame(): void {
    this.apiService
      .startGame('Jugador 1 (Angular)', 'Jugador 2 (Angular)')
      .subscribe({
        next: (gameData) => {
          console.log('Juego iniciado:', gameData);
          alert('¡Juego iniciado! Revisa la consola para el estado.');
          // Aquí actualizarías el estado de tu UI con los datos del juego
        },
        error: (err) => {
          console.error('Error al iniciar el juego:', err);
          alert('Error al iniciar el juego.');
        },
      });
  }
}
