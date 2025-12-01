import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotifyService } from '../../core/services/notify.service';

@Component({
  selector: 'app-two-factor',
  imports: [ReactiveFormsModule],
  template: `
    <div class="row justify-content-center">
      <div class="col-12 col-sm-10 col-md-7 col-lg-5">
        <div class="card shadow-sm">
          <div class="card-body p-4">
            <h1 class="h5 mb-3">Verificar código</h1>

            <form [formGroup]="form" (ngSubmit)="onSubmit()" class="vstack gap-3">
              <div class="form-floating">
                <input
                  id="code"
                  class="form-control"
                  type="text"
                  placeholder="000000"
                  formControlName="code"
                  maxlength="6"
                />
                <label for="code">Código de 6 dígitos</label>
              </div>

              <button class="btn btn-primary w-100" type="submit" [disabled]="submitting()">
                @if (submitting()) { <span class="spinner-border spinner-border-sm me-2"></span> }
                Verificar
              </button>

              <button class="btn btn-link w-100" type="button" (click)="resendCode()">
                Reenviar código
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'd-block py-4' },
})
export class TwoFactorComponent {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthService);
  private notify = inject(NotifyService);

  submitting = signal(false);
  email = signal<string>('');

  form = this.fb.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  constructor() {
    const emailParam = this.route.snapshot.queryParamMap.get('email') ?? '';
    this.email.set(emailParam);
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notify.warning('Revisa el código (6 dígitos).');
      return;
    }
    const code = this.form.controls.code.value ?? '';
    const email = this.email();

    this.submitting.set(true);
    const auth = this.auth as AuthService & {
      verifyTwoFactorCode: (payload: { email: string; code: string }) => Promise<void>;
    };
    auth
      .verifyTwoFactorCode({ email, code })
      .then(async () => {
        this.submitting.set(false);
        this.notify.success('Inicio de sesión exitoso.');
        await this.router.navigate(['/dashboard']);
      })
      .catch(() => {
        this.submitting.set(false);
        this.notify.error('Código inválido o expirado.');
      });
  }

  resendCode() {
    const email = this.email();
    const auth = this.auth as AuthService & {
      resendTwoFactorCode: (email: string) => Promise<void>;
    };
    auth
      .resendTwoFactorCode(email)
      .then(() => this.notify.info('Código reenviado. Revisa tu correo.'))
      .catch(() => this.notify.error('No se pudo reenviar el código.'));
  }
}
