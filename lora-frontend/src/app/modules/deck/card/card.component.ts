import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Card } from '../../../models/card.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  imports: [CommonModule],
  templateUrl: './card.component.html',
  styleUrl: './card.component.css',
})
export class CardComponent {
  _card: Card | null = null;
  _index: number = 0;
  _originalIndex: number = 0;

  @Input() set card(value: Card) {
    this._card = value;
  }

  @Input() set index(value: number) {
    this._index = value;
    this._originalIndex = value;
  }

  @Output() cardClicked = new EventEmitter<Card>();

  constructor() {}

  addCardToDeck(card: Card) {
    this.cardClicked.emit(card);
  }

  raiseIndex() {
    this._index = 999999; // o cualquier valor alto para ponerlo por encima
  }

  resetIndex() {
    this._index = this._originalIndex; // valor por defecto
  }
}
