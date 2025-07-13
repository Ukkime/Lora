import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { Card } from '../../../models/card.model';
import { Deck } from '../../../models/deck.model';
import { CardComponent } from '../card/card.component';
import { FormsModule } from '@angular/forms';
import { MapFactionsPipe } from '../../../pipes/map-factions.pipe';

@Component({
  selector: 'app-deck-builder',
  standalone: true,
  imports: [CommonModule, CardComponent, FormsModule, MapFactionsPipe],
  templateUrl: './deck-builder.component.html',
  styleUrl: './deck-builder.component.css',
})
export class DeckBuilderComponent implements OnInit {
  allCards: Card[] = [];
  ownedCards: Card[] = [];
  decks: Deck[] = [];
  selectedDeck: Card[] = [];
  deckName = '';
  errorMsg = '';
  successMsg = '';
  loading = false;
  editingDeckId: number | null = null;
  minDeckSize = 30;
  maxDeckSize = 60;
  dragCardId: string | null = null;
  dragSource: 'collection' | 'deck' | null = null;

  // Modo expandido/compacto
  expandedView = false;

  // Filtros y búsqueda
  searchText = '';
  filterRarity = '';
  filterFaction = '';
  sortOrder: 'name' | 'rarity' = 'name';

  toggleExpandedView() {
    this.expandedView = !this.expandedView;
  }

  constructor(private api: ApiService) {}

  filteredOwnedCards(): Card[] {
    let cards = this.ownedCards;
    if (this.searchText) {
      const txt = this.searchText.toLowerCase();
      cards = cards.filter(c => c.name.toLowerCase().includes(txt));
    }
    if (this.filterRarity) {
      cards = cards.filter(c => c.rarity === this.filterRarity);
    }
    if (this.filterFaction) {
      cards = cards.filter(c => c.faction === this.filterFaction);
    }
    if (this.sortOrder === 'name') {
      cards = [...cards].sort((a, b) => a.name.localeCompare(b.name));
    } else if (this.sortOrder === 'rarity') {
      // Las claves deben ser exactamente 'Mythic', 'Rare', 'Uncommon', 'Common'
      const rarityOrder: Record<string, number> = { Mythic: 0, Rare: 1, Uncommon: 2, Common: 3 };
      cards = [...cards].sort((a, b) => (rarityOrder[a.rarity] ?? 99) - (rarityOrder[b.rarity] ?? 99));
    }
    return cards;
  }

  // Devuelve el número de copias de una carta en el mazo actual
  cardCountInDeck(card: Card): number {
    return this.selectedDeck.filter(c => c.id === card.id).length;
  }

  onCardDragStart(card: Card, source: 'collection' | 'deck', event: DragEvent) {
    this.dragCardId = card.id;
    this.dragSource = source;
    event.dataTransfer?.setData('text/plain', card.id);
    event.dataTransfer?.setData('source', source);
  }

  onDeckDrop(event: DragEvent) {
    event.preventDefault();
    const cardId = event.dataTransfer?.getData('text/plain');
    const source = event.dataTransfer?.getData('source');
    if (cardId && source === 'collection') {
      const card = this.ownedCards.find(c => c.id === cardId);
      if (card) this.addCard(card);
    }
    this.dragCardId = null;
    this.dragSource = null;
  }

  onCollectionDrop(event: DragEvent) {
    event.preventDefault();
    const cardId = event.dataTransfer?.getData('text/plain');
    const source = event.dataTransfer?.getData('source');
    if (cardId && source === 'deck') {
      const idx = this.selectedDeck.findIndex(c => c.id === cardId);
      if (idx !== -1) this.selectedDeck.splice(idx, 1);
    }
    this.dragCardId = null;
    this.dragSource = null;
  }

  allowDrop(event: DragEvent) {
    event.preventDefault();
  }

  ngOnInit(): void {
    this.loadCards();
    this.loadDecks();
  }

  loadCards() {
    this.loading = true;
    this.api.getCards().subscribe({
      next: (cards) => {
        this.allCards = cards;
        this.ownedCards = cards.filter(c => c.available);
        this.loading = false;
      },
      error: () => { this.errorMsg = 'Error al cargar cartas.'; this.loading = false; }
    });
  }

  loadDecks() {
    this.api.getDecks().subscribe({
      next: (decks) => this.decks = decks,
      error: () => this.errorMsg = 'Error al cargar mazos.'
    });
  }

  addCard(card: Card) {
    if (this.selectedDeck.length >= this.maxDeckSize) return;
    const count = this.selectedDeck.filter(c => c.id === card.id).length;
    if (count >= 4) return; // Máximo 4 copias por carta
    this.selectedDeck.push(card);
  }

  removeCard(card: Card) {
    const idx = this.selectedDeck.findIndex(c => c.id === card.id);
    if (idx !== -1) this.selectedDeck.splice(idx, 1);
  }

  clearDeck() {
    this.selectedDeck = [];
    this.deckName = '';
    this.editingDeckId = null;
    this.successMsg = '';
    this.errorMsg = '';
  }

  saveDeck() {
    if (!this.deckName.trim()) {
      this.errorMsg = 'El nombre del mazo es obligatorio.';
      return;
    }
    if (this.selectedDeck.length < this.minDeckSize) {
      this.errorMsg = `El mazo debe tener al menos ${this.minDeckSize} cartas.`;
      return;
    }
    const deckData = { name: this.deckName, cards: this.selectedDeck.map(c => c.id) };
    if (this.editingDeckId) {
      this.api.updateDeck(this.editingDeckId, deckData).subscribe({
        next: () => { this.successMsg = 'Mazo actualizado.'; this.loadDecks(); },
        error: () => this.errorMsg = 'Error al actualizar mazo.'
      });
    } else {
      this.api.createDeck(deckData).subscribe({
        next: () => { this.successMsg = 'Mazo guardado.'; this.loadDecks(); },
        error: () => this.errorMsg = 'Error al guardar mazo.'
      });
    }
    this.clearDeck();
  }

  editDeck(deck: Deck) {
    this.deckName = deck.name;
    let cards: any = deck.cards;
    // Si viene como string, intenta parsear
    if (typeof cards === 'string') {
      try {
        cards = JSON.parse(cards);
      } catch (e) {
        cards = [];
      }
    }
    this.selectedDeck = Array.isArray(cards) ? [...cards] : [];
    this.editingDeckId = deck.id || null;
    this.successMsg = '';
    this.errorMsg = '';
  }

  deleteDeck(deck: Deck) {
    if (!deck.id) return;
    this.api.deleteDeck(deck.id).subscribe({
      next: () => { this.successMsg = 'Mazo eliminado.'; this.loadDecks(); },
      error: () => this.errorMsg = 'Error al eliminar mazo.'
    });
    this.clearDeck();
  }
}
