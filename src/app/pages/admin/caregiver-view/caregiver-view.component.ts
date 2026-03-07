import { Component, OnInit, inject, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { SupabaseService } from '../../../core/services/supabase.service';
import { Pet, MedicalRecord } from '../../../shared/models';
import { PetIconComponent } from '../../../shared/components/pet-icon/pet-icon.component';

@Component({
  selector: 'app-caregiver-view',
  standalone: true,
  imports: [CommonModule, PetIconComponent],
  templateUrl: './caregiver-view.component.html',
})
export class CaregiverViewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private supabase = inject(SupabaseService);
  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);
  private titleService = inject(Title);

  pet: Pet | null = null;
  meds: MedicalRecord[] = [];
  loading = true;
  error = '';

  // NOVA FUNÇÃO DE IMPRESSÃO (O Hack do Clone)
  print() {
    const ficha = document.getElementById('ficha-pet');
    if (!ficha) return;

    // 1. Esconde o aplicativo Angular inteiro (Some com cabeçalho, rodapé, tudo!)
    const appRoot = document.querySelector('app-root') as HTMLElement;
    const originalDisplay = appRoot ? appRoot.style.display : '';
    if (appRoot) appRoot.style.display = 'none';

    // 2. Cria um clone perfeito apenas da ficha
    const clone = ficha.cloneNode(true) as HTMLElement;
    clone.id = 'print-clone';

    // 3. Removemos as restrições de tamanho para ela usar 100% do papel A4
    clone.classList.remove('max-w-2xl', 'mx-auto', 'shadow-sm', 'border', 'border-slate-200/60');
    clone.classList.add('w-full', 'max-w-full', 'p-0');

    // 4. Cola a ficha no fundo do navegador (que agora está vazio)
    document.body.appendChild(clone);
    document.body.style.backgroundColor = 'white';

    // 5. Dá um milissegundo pro navegador respirar e chama a impressão
    setTimeout(() => {
      window.print();

      // 6. Assim que a janela fechar, desfazemos toda a mágica instantaneamente
      document.body.removeChild(clone);
      if (appRoot) appRoot.style.display = originalDisplay;
      document.body.style.backgroundColor = '';
    }, 50);
  }

  formatAge(birthDate: string | null | undefined): string {
    if (!birthDate) return 'Idade não informada';
    const birth = new Date(birthDate);
    if (Number.isNaN(birth.getTime())) return 'Idade não informada';
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();

    if (months < 0) {
      years -= 1;
      months += 12;
    }

    if (years <= 0 && months <= 0) return 'Recém-nascido';
    if (years === 0) return `${months} mes${months > 1 ? 'es' : ''}`;
    if (months === 0) return `${years} ano${years > 1 ? 's' : ''}`;
    return `${years}a ${months}m`;
  }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'Pet não encontrado';
      this.loading = false;
      return;
    }

    try {
      const data = await this.supabase.getPetById(id);
      let records: MedicalRecord[] = [];

      if (data) {
        this.titleService.setTitle(`Ficha_de_Cuidados_${data.name.replace(/\s+/g, '_')}`);
        records = await this.supabase.getMedicalRecordsByPet(id);
      }

      this.ngZone.run(() => {
        this.pet = data;
        this.meds = records.filter(
          (r) => r.type === 'consulta' || r.type === 'exame' || r.type === 'cirurgia',
        );
      });
    } catch (e: unknown) {
      this.ngZone.run(() => {
        this.error = e instanceof Error ? e.message : 'Erro ao carregar dados';
      });
    } finally {
      this.ngZone.run(() => {
        this.loading = false;
        this.cdr.detectChanges();
      });
    }
  }
}
