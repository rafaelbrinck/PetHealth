import { Component, inject, NgZone, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './forgot-password.html',
})
export class ForgotPasswordComponent {
  private supabase = inject(SupabaseService);
  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);

  email = '';
  loading = false;
  error = '';
  success = false;

  private getFriendlyErrorMessage(e: any): string {
    if (!e) return 'Ocorreu um erro desconhecido.';
    const msg = String(e.message || e).toLowerCase();
    if (msg.includes('rate limit')) return 'Muitos pedidos. Aguarde alguns minutos.';
    if (msg.includes('not found')) return 'Não encontramos uma conta com este e-mail.';
    return 'Erro ao tentar enviar o e-mail de recuperação.';
  }

  async onSubmit() {
    if (!this.email) return;
    this.error = '';
    this.success = false;
    this.loading = true;

    try {
      await this.supabase.resetPasswordForEmail(this.email);
      this.ngZone.run(() => {
        this.success = true; // Mostra a mensagem de sucesso na tela
      });
    } catch (e: any) {
      this.ngZone.run(() => {
        this.error = this.getFriendlyErrorMessage(e);
      });
    } finally {
      this.ngZone.run(() => {
        this.loading = false;
        this.cdr.detectChanges();
      });
    }
  }
}
