import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { Card } from '../../../models/card.model';
import { CardComponent } from '../card/card.component';

@Component({
  selector: 'app-owned-cards',
  standalone: true,
  imports: [CommonModule, CardComponent],
  templateUrl: './owned-cards.component.html',
  styleUrl: './owned-cards.component.css',
})
export class OwnedCardsComponent implements OnInit {
  ownedCards: Card[] = [];
  loading = false;
  error = '';

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loading = true;
    this.api.getCards().subscribe({
      next: (cards) => {
        this.ownedCards = cards.filter(c => c.available);
        this.loading = false;
      },
      error: (err) => {
        this.error = 'No se pudieron cargar tus cartas.';
        this.loading = false;
      },
    });
  }
}
