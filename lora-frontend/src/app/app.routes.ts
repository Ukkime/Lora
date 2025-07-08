import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./modules/core/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'mercado',
    loadComponent: () => import('./modules/deck/market/market.component').then(m => m.MercadoComponent),
  },
  {
    path: 'juego',
    loadComponent: () => import('./modules/core/game/game.component').then(m => m.GameComponent),
  },
  {
    path: 'mis-cartas',
    loadComponent: () => import('./modules/deck/owned-cards/owned-cards.component').then(m => m.OwnedCardsComponent),
  },
  {
    path: 'creador-mazos',
    loadComponent: () => import('./modules/deck/deck-builder/deck-builder.component').then(m => m.DeckBuilderComponent),
  },
  {
    path: 'tablero/:gameId',
    loadComponent: () => import('./modules/core/game-board/game-board.component').then(m => m.GameBoardComponent),
  },
];
