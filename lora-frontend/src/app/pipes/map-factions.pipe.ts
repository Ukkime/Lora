import { Pipe, PipeTransform } from '@angular/core';
import { Card } from '../models/card.model';

@Pipe({
  name: 'mapFactions',
  standalone: true,
})
export class MapFactionsPipe implements PipeTransform {
  transform(cards: Card[]): string[] {
    const set = new Set<string>();
    cards.forEach(c => { if (c.faction) set.add(c.faction); });
    return Array.from(set).sort();
  }
}
