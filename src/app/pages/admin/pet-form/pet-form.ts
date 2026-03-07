import { Component, inject, NgZone, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';
import { Pet } from '../../../shared/models';

@Component({
  selector: 'app-pet-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './pet-form.html',
})
export class PetForm implements OnInit {
  private fb = inject(FormBuilder);
  private supabase = inject(SupabaseService);
  private router = inject(Router);
  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);

  readonly form = this.fb.group({
    name: ['', [Validators.required]],
    species: ['', [Validators.required]],
    breed: [''],
    birth_date: [''],
    gender: ['', [Validators.required]],
  });

  loading = false;
  error = '';
  isEdit = false;
  petId: string | null = null;

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.petId = id;
      await this.loadPetData(id);
    }
  }

  private async loadPetData(id: string) {
    this.loading = true;
    try {
      const pet = await this.supabase.getPetById(id);
      this.ngZone.run(() => {
        if (pet) {
          this.form.patchValue({
            name: pet.name,
            species: pet.species,
            breed: pet.breed || '',
            birth_date: pet.birth_date || '',
            gender: pet.gender,
          });
        } else {
          this.error = 'Pet não encontrado.';
        }
      });
    } catch (e: unknown) {
      this.ngZone.run(() => {
        this.error = e instanceof Error ? e.message : 'Erro ao carregar pet';
      });
    } finally {
      this.ngZone.run(() => {
        this.loading = false;
        this.cdr.detectChanges();
      });
    }
  }

  getFieldError(controlName: string): string | null {
    const control = this.form.get(controlName);
    if (!control) return null;
    if (control.hasError('required') && (control.dirty || control.touched)) {
      if (controlName === 'name') return 'Nome é obrigatório.';
      if (controlName === 'species') return 'Espécie é obrigatória.';
      if (controlName === 'gender') return 'Gênero é obrigatório.';
    }
    return null;
  }

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = '';

    const value = this.form.value;

    try {
      if (this.isEdit && this.petId) {
        await this.supabase.updatePet(this.petId, {
          name: value.name ?? '',
          species: value.species ?? '',
          breed: value.breed ?? undefined,
          birth_date: value.birth_date ?? null,
          gender: value.gender ?? '',
        });
      } else {
        await this.supabase.createPet({
          name: value.name ?? '',
          species: value.species ?? '',
          breed: value.breed ?? undefined,
          birth_date: value.birth_date ?? null,
          gender: value.gender ?? '',
        });
      }
      this.ngZone.run(() => this.router.navigate(['/admin/pets']));
    } catch (e: unknown) {
      this.ngZone.run(() => {
        this.error = e instanceof Error ? e.message : 'Erro ao salvar pet';
      });
    } finally {
      this.ngZone.run(() => {
        this.loading = false;
        this.cdr.detectChanges();
      });
    }
  }
}
