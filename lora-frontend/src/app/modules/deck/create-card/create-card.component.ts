import { Component, ChangeDetectorRef } from '@angular/core';
import { ImageCroppedEvent, ImageCropperComponent } from 'ngx-image-cropper';
import { FormBuilder, FormGroup, Validators, FormArray, AbstractControl } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { CardData, ManaCost, LoyaltyAbility } from '../../../interfaces/card-data.interface';
import { Card } from '../../../models/card.model';
import { CardComponent } from '../card/card.component';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-create-card',
  standalone: true,
  templateUrl: './create-card.component.html',
  styleUrls: ['./create-card.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardComponent,
    ImageCropperComponent,
  ],
})
export class CreateCardComponent {
  imageChangedEvent: any = '';
  croppedImage: string = '';
  cropping: boolean = false;

  // Getter para vista previa de carta
  get previewCard(): Card {
    // Asegura que todos los campos requeridos por Card estén presentes
    const value = this.cardForm.value;
    return {
      id: 'preview', // id string para evitar error de tipos
      name: value.name || '',
      baseType: value.baseType || '',
      manaCost: value.manaCost || { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 },
      text: value.text || '',
      power: value.power ?? undefined,
      toughness: value.toughness ?? undefined,
      initialLoyalty: value.initialLoyalty ?? undefined,
      loyaltyAbilities: value.loyaltyAbilities || [],
      providesMana: value.providesMana || '',
      rarity: value.rarity || '',
      faction: value.faction || '',
      price: value.price ?? 0,
      image: value.image || '',
      available: true, // para preview siempre disponible
      formattedManaCost: this.formatManaCost(value.manaCost),
      attributes: value.attributes || [],
      activatedAbilities: value.activatedAbilities || [],
    } as Card;
  }

  private formatManaCost(manaCost: ManaCost): string {
    if (!manaCost) return '';
    let symbols = '';
    for (const color of ['W', 'U', 'B', 'R', 'G', 'C']) {
      const value = manaCost[color as keyof ManaCost];
      if (value !== undefined && value > 0) {
        symbols += `{${color}:${value}}`;
      }
    }
    return symbols;
  }

  get manaCostGroup(): FormGroup | null {
    const group = this.cardForm.get('manaCost');
    return group instanceof FormGroup ? group : null;
  }

  fileChangeEvent(event: any): void {
    this.imageChangedEvent = event;
    this.cropping = true;
  }

  onImageCropped(event: ImageCroppedEvent) {
    // console.log('Crop event:', event);
    if (event.base64) {
      this.croppedImage = event.base64;
      // console.log('Base64:', this.croppedImage.slice(0, 60) + '...');
    } else if (event.blob) {
      // Convertir blob a base64 manualmente
      const reader = new FileReader();
      reader.onload = () => {
        this.croppedImage = reader.result as string;
        // console.log('Base64 (from blob):', this.croppedImage.slice(0, 60) + '...');
      };
      reader.onerror = () => {
        // console.error('Error leyendo blob');
        this.croppedImage = '';
      };
      reader.readAsDataURL(event.blob);
    } else {
      this.croppedImage = '';
      // console.warn('No se generó base64 ni blob');
    }
  }

  acceptCrop() {
    // Oculta el cropper y deja la imagen recortada como definitiva
    this.imageChangedEvent = '';
    this.cropping = false;
    // Actualiza el preview de la carta con la imagen recortada
    this.cardForm.patchValue({ image: this.croppedImage });
    this.cdr.detectChanges();
  }

  cancelCrop() {
    this.imageChangedEvent = '';
    this.croppedImage = '';
    this.cropping = false;
    this.cardForm.patchValue({ image: '' });
  }
  cardForm: FormGroup;
  successMessage = '';
  errorMessage = '';
  isSubmitting = false;

  // Opciones para selects
  baseTypes = [
    'Enchantment',
    'Creature',
    'Spell',
    'Planeswalker',
    'Artifact',
    'Land',
  ];
  rarities = ['common', 'special', 'uncommon', 'mythic', 'legendary'];
  factions = [
    'elf',
    'dwarf',
    'human',
    'demon',
    'angel',
    'undead',
    'beast',
    'elemental',
    'necropolis',
    'tribal',
  ];
  manaColors = ['W', 'U', 'B', 'R', 'G', 'C'];

  get attributes(): FormArray {
    return this.cardForm.get('attributes') as FormArray;
  }
  get activatedAbilities(): FormArray {
    return this.cardForm.get('activatedAbilities') as FormArray;
  }

  addAttribute() {
    this.attributes.push(
      this.fb.group({
        code: [''],
        name: [''],
        description: [''],
      })
    );
  }
  removeAttribute(index: number) {
    this.attributes.removeAt(index);
  }

  addActivatedAbility() {
    this.activatedAbilities.push(
      this.fb.group({
        name: [''],
        description: [''],
        manaCost: this.fb.group({
          W: [0],
          U: [0],
          B: [0],
          R: [0],
          G: [0],
          C: [0],
        }),
      })
    );
  }
  removeActivatedAbility(index: number) {
    this.activatedAbilities.removeAt(index);
  }

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {
    this.cardForm = this.fb.group({
      name: ['', Validators.required],
      baseType: ['', Validators.required],
      manaCost: this.fb.group({
        W: [0],
        U: [0],
        B: [0],
        R: [0],
        G: [0],
        C: [0],
      }),
      text: ['', Validators.required],
      power: [null],
      toughness: [null],
      initialLoyalty: [null],
      loyaltyAbilities: this.fb.array([]),
      attributes: this.fb.array([]), // <-- Agregado para atributos especiales
      activatedAbilities: this.fb.array([]), // <-- Agregado para habilidades activadas
      providesMana: [''],
      rarity: ['', Validators.required],
      faction: ['', Validators.required],
      price: [null],
      image: [''],
    });
  }

  get loyaltyAbilities(): FormArray {
    return this.cardForm.get('loyaltyAbilities') as FormArray;
  }

  addLoyaltyAbility() {
    this.loyaltyAbilities.push(
      this.fb.group({
        cost: [0, Validators.required],
        type: ['plus', Validators.required],
        name: ['', Validators.required],
        description: ['', Validators.required],
      })
    );
  }

  removeLoyaltyAbility(index: number) {
    this.loyaltyAbilities.removeAt(index);
  }

  onBaseTypeChange() {
    const baseType = this.cardForm.value.baseType;
    // Limpiar campos condicionales
    if (baseType !== 'Creature') {
      this.cardForm.patchValue({ power: null, toughness: null });
    }
    if (baseType !== 'Planeswalker') {
      this.cardForm.patchValue({ initialLoyalty: null });
      while (this.loyaltyAbilities.length) this.loyaltyAbilities.removeAt(0);
    }
    if (baseType !== 'Land') {
      this.cardForm.patchValue({ providesMana: '' });
    }
    // Limpiar atributos y habilidades activadas
    while (this.attributes.length) this.attributes.removeAt(0);
    while (this.activatedAbilities.length) this.activatedAbilities.removeAt(0);
  }

  submit() {
    this.successMessage = '';
    this.errorMessage = '';
    if (this.cardForm.invalid) {
      this.errorMessage = 'Por favor completa todos los campos obligatorios.';
      return;
    }
    this.isSubmitting = true;
    // Preparar el objeto CardData (sin id ni available)
    const formValue = { ...this.cardForm.value };
    // Eliminar campos no aplicables
    if (formValue.baseType !== 'Creature') {
      delete formValue.power;
      delete formValue.toughness;
    }
    if (formValue.baseType !== 'Planeswalker') {
      delete formValue.initialLoyalty;
      delete formValue.loyaltyAbilities;
    }
    if (formValue.baseType !== 'Land') {
      delete formValue.providesMana;
    }
    // Si no hay atributos ni habilidades activadas, asegúrate de no enviar arrays vacíos
    if (!formValue.attributes || formValue.attributes.length === 0)
      delete formValue.attributes;
    if (
      !formValue.activatedAbilities ||
      formValue.activatedAbilities.length === 0
    )
      delete formValue.activatedAbilities;
    this.api.createCard(formValue).subscribe({
      next: (res) => {
        this.successMessage = '¡Carta creada exitosamente!';
        this.cardForm.reset();
        // Re-inicializa el FormGroup anidado manaCost para evitar errores de tipo
        this.cardForm.setControl(
          'manaCost',
          this.fb.group({
            W: [0],
            U: [0],
            B: [0],
            R: [0],
            G: [0],
            C: [0],
          })
        );
        this.isSubmitting = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Error al crear la carta.';
        this.isSubmitting = false;
      },
    });
  }

  asFormGroup(control: AbstractControl | null): FormGroup {
    return control as FormGroup;
  }

  debug() {
    console.log(this.cardForm.value);
  }
}
