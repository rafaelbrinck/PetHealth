import { Component, inject, NgZone, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './reset-password.html',
})
export class ResetPasswordComponent {
  private supabase = inject(SupabaseService);
  private router = inject(Router);
  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);

  password = '';
  confirmPassword = '';
  loading = false;
  error = '';
  success = false;

  private getFriendlyErrorMessage(e: any): string {
    if (!e) return 'Ocorreu um erro desconhecido.';
    const msg = String(e.message || e).toLowerCase();
    if (msg.includes('should be at least 6 characters'))
      return 'A senha deve ter pelo menos 6 caracteres.';
    return 'Não foi possível atualizar a senha. O link pode ter expirado.';
  }

  async onSubmit() {
    if (!this.password || !this.confirmPassword) return;

    if (this.password !== this.confirmPassword) {
      this.error = 'As senhas não coincidem. Digite novamente.';
      return;
    }

    this.error = '';
    this.loading = true;

    try {
      await this.supabase.updatePassword(this.password);
      this.ngZone.run(() => {
        this.success = true;
        // Redireciona para o login após 3 segundos
        setTimeout(() => this.router.navigate(['/login']), 3000);
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
