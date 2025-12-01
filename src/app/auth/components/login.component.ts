import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotifyService } from '../../core/services/notify.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  template: `
    <div class="row justify-content-center">
      <div class="col-12 col-sm-10 col-md-7 col-lg-5">
        <div class="card shadow-sm">
          <div class="card-body p-4">
            <h1 class="h4 mb-3">Iniciar sesión</h1>

            <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate class="vstack gap-3">
              <div class="form-floating">
                <input
                  id="email"
                  class="form-control"
                  type="email"
                  placeholder="name@example.com"
                  formControlName="email"
                  [class.is-invalid]="invalid('email')"
                  autocomplete="email"
                />
                <label for="email">Correo</label>
                @if (invalid('email')) {
                <div class="invalid-feedback">Correo válido es requerido.</div>
                }
              </div>

              <div class="form-floating">
                <input
                  id="password"
                  class="form-control"
                  type="password"
                  placeholder="Tu contraseña"
                  formControlName="password"
                  [class.is-invalid]="invalid('password')"
                  autocomplete="current-password"
                />
                <label for="password">Contraseña</label>
                @if (invalid('password')) {
                <div class="invalid-feedback">Contraseña es requerida (mínimo 6).</div>
                }
              </div>

              <button class="btn btn-primary w-100" type="submit" [disabled]="submitting()">
                @if (submitting()) { <span class="spinner-border spinner-border-sm me-2"></span> }
                Entrar
              </button>
            </form>

            @if (message()) {
            <div class="alert alert-info mt-3 mb-0">{{ message() }}</div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'd-block py-4' },
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private auth = inject(AuthService);
  private notify = inject(NotifyService);

  submitting = signal(false);
  message = signal<string | null>(null);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  invalid = (control: keyof typeof this.form.controls) => {
    const c = this.form.controls[control];
    return c.invalid && (c.dirty || c.touched);
  };

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    const { email, password } = this.form.getRawValue() as { email: string; password: string };
    this.auth
      .login({ email, password })
      .then(async () => {
        this.submitting.set(false);
        this.notify.info('Se envió el código 2FA a tu correo.');
        await this.router.navigate(['/auth/2fa'], { queryParams: { email } });
      })
      .catch(() => {
        this.submitting.set(false);
        this.notify.error('Credenciales inválidas o error en el servidor.');
      });
  }
}
