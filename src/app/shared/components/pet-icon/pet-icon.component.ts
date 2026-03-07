import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pet-icon',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pet-icon.component.html',
})
export class PetIconComponent {
  @Input() species: string | null | undefined;
  @Input() isDead: boolean = false;

  /**
   * Normaliza a string da espécie e retorna uma chave para o ícone.
   * Usada no template com @switch para renderizar SVGs diferentes.
   */
  getPetIconType(species: string | null | undefined): string {
    if (!species) return 'heart';
    const normalized = species
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[^\w\s-]/g, '') // remove acentos
      .replace(/\s+/g, ' ');

    switch (normalized) {
      case 'cachorro':
        return 'dog';
      case 'gato':
        return 'cat';
      case 'porquinho da india':
      case 'porquinho-da-india':
        return 'pig';
      case 'coelho':
        return 'rabbit';
      case 'cobra':
        return 'snake';
      case 'tartaruga':
        return 'turtle';
      case 'passaro':
      case 'passaros':
        return 'bird';
      case 'rato':
      case 'ratos':
        return 'mouse';
      case 'hamster':
        return 'hamster';
      default:
        return 'heart';
    }
  }
}
