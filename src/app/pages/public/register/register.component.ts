import { Component, inject, NgZone, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  private supabase = inject(SupabaseService);
  private router = inject(Router);
  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef); // Garante a atualização da tela

  fullName = '';
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

    if (msg.includes('user already registered')) {
      return 'Este e-mail já está cadastrado. Que tal tentar fazer login?';
    }
    if (msg.includes('password should be at least 6 characters')) {
      return 'Sua senha é muito curta. Use pelo menos 6 caracteres.';
    }
    if (msg.includes('invalid email') || msg.includes('format')) {
      return 'O formato do e-mail é inválido. Verifique se digitou corretamente.';
    }
    if (msg.includes('rate limit')) {
      return 'Muitas tentativas de cadastro. Por favor, aguarde alguns minutos.';
    }

    return 'Ocorreu um erro ao criar sua conta. Tente novamente mais tarde.';
  }

  async onSubmit() {
    if (!this.email || !this.password || !this.fullName) return;

    this.error = '';
    this.loading = true;

    try {
      await this.supabase.signUp(this.email, this.password, this.fullName);
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
