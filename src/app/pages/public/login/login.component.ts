import { Component, inject, NgZone, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private supabase = inject(SupabaseService);
  private router = inject(Router);
  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef); // Garante a atualização da tela

  email = '';
  password = '';
  loading = false;
  error = '';

  // Extrator de erro ultra seguro
  private getFriendlyErrorMessage(e: any): string {
    if (!e) return 'Ocorreu um erro desconhecido. Tente novamente.';

    // Pega a mensagem independente do formato que o Supabase devolver
    const rawMsg = e.message || e.error_description || e.error || String(e);
    const msg = String(rawMsg).toLowerCase();

    if (msg.includes('invalid login credentials')) {
      return 'E-mail ou senha incorretos. Verifique e tente novamente.';
    }
    if (msg.includes('email not confirmed')) {
      return 'Por favor, confirme seu e-mail antes de fazer login.';
    }
    if (msg.includes('rate limit')) {
      return 'Muitas tentativas de login. Por favor, aguarde alguns minutos.';
    }

    return 'Não foi possível fazer o login. Verifique seus dados.';
  }

  async onSubmit() {
    if (!this.email || !this.password) return;

    this.error = '';
    this.loading = true;

    try {
      await this.supabase.signIn(this.email, this.password);
      this.ngZone.run(() => this.router.navigate(['/admin/dashboard']));
    } catch (e: any) {
      this.ngZone.run(() => {
        // Envia o erro bruto (seja texto ou objeto) para o tradutor
        this.error = this.getFriendlyErrorMessage(e);
      });
    } finally {
      this.ngZone.run(() => {
        this.loading = false;
        this.cdr.detectChanges(); // Obriga o Angular a parar o spinner de loading
      });
    }
  }
}
