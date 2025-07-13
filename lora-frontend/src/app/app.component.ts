// src/app/app.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Needed for ngIf, ngFor
import { RouterModule } from '@angular/router';
import { NavbarComponent } from "./modules/core/navbar/navbar.component"; // Needed for router-outlet
import { AuthService } from './modules/core/login/auth.service';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent], // Added RouterModule for router-outlet
})
export class AppComponent implements OnInit {
  title = 'Juego de Cartas (Frontend Angular)';
  isLoggedIn$: any;

  constructor(public authService: AuthService) {}

  ngOnInit(): void {
    this.isLoggedIn$ = this.authService.user$.pipe(
      map((user: { username: string | null }) => !!user.username)
    );
  }
}





  // This method is now obsolete as deck is sent with joinQueue
  // saveDeck(): void {
  //   const deckIds = this.selectedDeck.map(card => card.id);
  //   // You might have a specific API endpoint to save the deck to a user profile
  //   // For now, it's included with the joinGameQueue call.
  //   console.log('Deck saved/prepared for joining queue:', deckIds);
  //   alert('Mazo guardado/preparado para la cola.');
  // }
