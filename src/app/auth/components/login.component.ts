import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotifyService } from '../../core/services/notify.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  template: `
    <div class="login-container">
      <div class="row justify-content-center align-items-center min-vh-100 py-5">
        <div class="col-12 col-sm-10 col-md-6 col-lg-5 col-xl-4">
          <div class="text-center mb-4">
            <div class="logo-circle mb-3">
              <i class="bi bi-car-front-fill"></i>
            </div>
            <h1 class="h3 fw-bold mb-2">CarMeet Admin</h1>
            <p class="text-muted">Panel de administración</p>
          </div>

          <div class="card border-0 shadow-lg">
            <div class="card-body p-4 p-sm-5">
              <h2 class="h5 fw-semibold mb-4">Iniciar sesión</h2>

              <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
                <div class="mb-3">
                  <label for="email" class="form-label fw-medium">
                    <i class="bi bi-envelope me-2"></i>Correo electrónico
                  </label>
                  <input
                    id="email"
                    class="form-control form-control-lg"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    formControlName="email"
                    [class.is-invalid]="invalid('email')"
                    autocomplete="email"
                  />
                  @if (invalid('email')) {
                    <div class="invalid-feedback">
                      Por favor ingresa un correo válido
                    </div>
                  }
                </div>

                <div class="mb-4">
                  <label for="password" class="form-label fw-medium">
                    <i class="bi bi-lock me-2"></i>Contraseña
                  </label>
                  <input
                    id="password"
                    class="form-control form-control-lg"
                    type="password"
                    placeholder="••••••••"
                    formControlName="password"
                    [class.is-invalid]="invalid('password')"
                    autocomplete="current-password"
                  />
                  @if (invalid('password')) {
                    <div class="invalid-feedback">
                      La contraseña debe tener al menos 6 caracteres
                    </div>
                  }
                </div>

                <button 
                  class="btn btn-primary btn-lg w-100 fw-semibold" 
                  type="submit" 
                  [disabled]="submitting()">
                  @if (submitting()) {
                    <span class="spinner-border spinner-border-sm me-2"></span>
                    Iniciando sesión...
                  } @else {
                    <i class="bi bi-box-arrow-in-right me-2"></i>
                    Iniciar sesión
                  }
                </button>
              </form>

              @if (message()) {
                <div class="alert alert-info mt-4 mb-0 d-flex align-items-center">
                  <i class="bi bi-info-circle-fill me-2"></i>
                  <span>{{ message() }}</span>
                </div>
              }
            </div>
          </div>

          <div class="text-center mt-4">
            <p class="text-muted small mb-0">
              <i class="bi bi-shield-check me-1"></i>
              Acceso seguro protegido con 2FA
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
      min-height: 100vh;
    }

    .logo-circle {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #3a3a3a 0%, #1a1a1a 100%);
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }

    .logo-circle i {
      font-size: 2.5rem;
      color: white;
    }

    .card {
      border-radius: 1rem;
      backdrop-filter: blur(10px);
      background: var(--bs-body-bg);
    }

    .form-control:focus {
      border-color: #495057;
      box-shadow: 0 0 0 0.25rem rgba(73, 80, 87, 0.25);
    }

    .btn-primary {
      background: linear-gradient(135deg, #495057 0%, #212529 100%);
      border: none;
      border-radius: 0.5rem;
      padding: 0.75rem 1.5rem;
      transition: all 0.3s ease;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
      background: linear-gradient(135deg, #5a6268 0%, #343a40 100%);
    }

    .btn-primary:disabled {
      background: linear-gradient(135deg, #495057 0%, #212529 100%);
      opacity: 0.7;
    }

    .form-label {
      color: var(--bs-body-color);
      font-size: 0.9rem;
    }

    .alert-info {
      border-radius: 0.5rem;
      border: none;
      background-color: var(--bs-secondary-bg);
      color: var(--bs-body-color);
    }

    h1, h2 {
      color: #fff;
    }

    .text-muted {
     color: rgb(255 255 255 / 75%) !important;
    }

    @media (max-width: 576px) {
      .card-body {
        padding: 1.5rem !important;
      }

      .logo-circle {
        width: 60px;
        height: 60px;
      }

      .logo-circle i {
        font-size: 2rem;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'd-block' },
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