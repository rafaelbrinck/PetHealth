import { Component, OnInit, OnDestroy, inject, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';
import { InventoryItem } from '../../../shared/models';
import { InventoryFormComponent } from '../inventory-form/inventory-form.component';

// Importações mágicas para reduzir chamadas ao banco
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [CommonModule, FormsModule, InventoryFormComponent],
  templateUrl: './inventory-list.component.html',
})
export class InventoryListComponent implements OnInit, OnDestroy {
  private supabase = inject(SupabaseService);
  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  items: InventoryItem[] = [];
  loading = true;
  error = '';
  isItemSheetOpen = false;
  searchQuery = '';
  selectedCategory = 'Todas';
  categoryOptions: string[] = [];

  // Fila de espera para as atualizações de quantidade
  private quantityUpdate$ = new Subject<{ item: InventoryItem; newQty: number }>();
  private sub?: Subscription;

  trackById(index: number, item: InventoryItem) {
    return item.id;
  }

  async ngOnInit() {
    await this.loadItems();

    // A mágica acontece aqui: Ouve as mudanças, mas espera 800ms de "silêncio" antes de salvar no banco
    this.sub = this.quantityUpdate$.pipe(debounceTime(800)).subscribe(async ({ item, newQty }) => {
      try {
        await this.supabase.updateInventoryQuantity(item.id!, newQty);
        // Não recarregamos a lista (loadItems) aqui para não tirar o foco do usuário enquanto ele digita (Optimistic UI)
      } catch (e) {
        console.error('Erro ao atualizar quantidade no banco', e);
        // Em caso de erro, recarregamos para voltar ao valor real do banco
        await this.loadItems();
      }
    });
  }

  ngOnDestroy() {
    // Limpa a memória quando o componente for destruído
    if (this.sub) this.sub.unsubscribe();
  }

  private async loadItems() {
    this.loading = true;
    try {
      const list = await this.supabase.getInventoryItems();
      this.ngZone.run(() => {
        this.items = list;
        this.error = '';
        this.updateCategoryOptions(list);
      });
    } catch (e: unknown) {
      this.ngZone.run(() => {
        this.error = e instanceof Error ? e.message : 'Erro ao carregar estoques';
      });
    } finally {
      this.ngZone.run(() => {
        this.loading = false;
        this.cdr.detectChanges();
      });
    }
  }

  get filteredItems(): InventoryItem[] {
    let result = [...this.items];

    const query = this.searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter((item) => {
        const name = (item.item_name ?? '').toLowerCase();
        const category = (item.category ?? '').toLowerCase();
        return name.includes(query) || category.includes(query);
      });
    }

    if (this.selectedCategory !== 'Todas') {
      const selected = this.selectedCategory.toLowerCase();
      result = result.filter((item) => (item.category ?? '').toLowerCase() === selected);
    }

    return result;
  }

  setCategoryFilter(category: string) {
    this.selectedCategory = category;
  }

  // --- NOVAS FUNÇÕES DE QUANTIDADE ---

  changeQuantity(item: InventoryItem, delta: number) {
    const newQty = Math.max(0, item.current_quantity + delta);
    item.current_quantity = newQty; // Atualiza a tela instantaneamente
    this.quantityUpdate$.next({ item, newQty }); // Manda pra fila de espera
  }

  updateQuantityFromInput(item: InventoryItem, value: number) {
    // Caso o usuário apague tudo no input, o valor vira 0 em vez de null
    const newQty = value === null || value === undefined || value < 0 ? 0 : value;
    item.current_quantity = newQty; // Atualiza a tela instantaneamente
    this.quantityUpdate$.next({ item, newQty }); // Manda pra fila de espera
  }

  // -----------------------------------

  addItem() {
    this.router.navigate(['/admin/inventory/new']);
  }

  openItemSheet() {
    this.isItemSheetOpen = true;
  }

  closeItemSheet() {
    this.isItemSheetOpen = false;
  }

  private updateCategoryOptions(list: InventoryItem[]) {
    const set = new Set<string>();
    for (const item of list) {
      const category = (item.category ?? '').trim();
      if (category) {
        set.add(category);
      }
    }
    this.categoryOptions = Array.from(set).sort((a, b) => a.localeCompare(b));
  }
}
