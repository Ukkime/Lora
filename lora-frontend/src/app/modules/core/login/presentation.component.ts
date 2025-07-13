import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-presentation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './presentation.component.html',
  styleUrls: ['./presentation.component.css']
})
export class PresentationComponent {
  @Output() finished = new EventEmitter<void>();

  textBlocks: string[] = [
    `Dicen los antiguos que antes de los nombres, antes de la luz y del tiempo, existía un susurro.`,
    `No tenía forma, ni sombra, ni destino. Solo una voluntad: recordar.`,
    `A esa voluntad, los sabios la llamaron Lora. No crea ni destruye. Recoge lo olvidado, enlaza lo perdido, despierta lo dormido.`,
    `Cuando los mundos tiemblan y los caminos se quiebran, Lora se manifiesta.`,
    `No para decidir el futuro, sino para ofrecer la elección. Aquellos que escuchan su eco, juegan con fragmentos de lo que fue… Y pueden reescribir lo que será.`
  ];
  currentBlock = 0;
  currentWords: { word: string, visible: boolean, fading: boolean }[] = [];
  wordIndex = 0;
  groupSize = 50; // Palabras por grupo

  ngOnInit() {
    this.animateBlock();
  }

  animateBlock() {
    if (this.currentBlock < this.textBlocks.length) {
      const words = this.textBlocks[this.currentBlock].split(' ');
      this.currentWords = words.map(w => ({ word: w, visible: false, fading: false }));
      this.wordIndex = 0;
      this.showNextGroup();
    } else {
      setTimeout(() => this.finished.emit(), 1800); // Pausa final antes de mostrar login
    }
  }

  showNextGroup() {
    if (this.wordIndex < this.currentWords.length) {
      // Mostrar grupo de palabras
      for (let i = 0; i < this.groupSize && (this.wordIndex + i) < this.currentWords.length; i++) {
        this.currentWords[this.wordIndex + i].visible = true;
      }
      setTimeout(() => {
        // Fade out grupo
        for (let i = 0; i < this.groupSize && (this.wordIndex + i) < this.currentWords.length; i++) {
          this.currentWords[this.wordIndex + i].fading = true;
        }
        this.wordIndex += this.groupSize;
        this.showNextGroup();
      }, 4800); // Tiempo que el grupo permanece visible
    } else {
      // Espera a que el último grupo termine de desvanecerse
      setTimeout(() => {
        this.currentBlock++;
        this.animateBlock();
      }, 1200);
    }
  }
}
