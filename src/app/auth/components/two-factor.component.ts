import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RecaptchaModule, RecaptchaFormsModule } from 'ng-recaptcha-2';
import { AuthService } from '../services/auth.service';
import { NotifyService } from '../../core/services/notify.service';

@Component({
  selector: 'app-two-factor',
  imports: [ReactiveFormsModule, RecaptchaModule, RecaptchaFormsModule],
  template: `
    <div class="login-container overflow-hidden">
      <div class="row justify-content-center align-items-center min-vh-100 py-5">
        <div class="col-12 col-sm-10 col-md-6 col-lg-5 col-xl-4">
          <div class="text-center mb-4">
            <div class="logo-circle mb-3">
              <i class="bi bi-shield-check"></i>
            </div>
            <h1 class="h3 fw-bold mb-2">Verificación 2FA</h1>
            <p class="text-muted">Ingresa el código enviado a tu correo</p>
          </div>

          <div class="card border-0 shadow-lg">
            <div class="card-body p-4 p-sm-5">
              <div class="text-center mb-4">
                <div class="email-badge">
                  <i class="bi bi-envelope-fill me-2"></i>
                  <small>{{ email() }}</small>
                </div>
              </div>

              <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
                <div class="mb-4">
                  <label for="code" class="form-label fw-medium">
                    <i class="bi bi-key me-2"></i>Código de verificación
                  </label>
                  <input
                    id="code"
                    class="form-control form-control-lg text-center code-input"
                    type="text"
                    placeholder="000000"
                    formControlName="code"
                    maxlength="6"
                    [class.is-invalid]="invalid('code')"
                    autocomplete="one-time-code"
                  />
                  @if (invalid('code')) {
                    <div class="invalid-feedback text-center">
                      @if (form.controls.code.errors?.['required']) {
                        El código es requerido
                      } @else if (form.controls.code.errors?.['pattern']) {
                        Ingresa un código de 6 dígitos
                      }
                    </div>
                  }
                  <div class="form-text text-center mt-2">
                    <i class="bi bi-info-circle me-1"></i>
                    El código expira en 5 minutos
                  </div>
                </div>

                <div class="mb-4 d-flex justify-content-center">
                  <re-captcha
                    formControlName="recaptchaToken"
                    (resolved)="onCaptchaResolved($event)"
                    (error)="onCaptchaError()"
                  ></re-captcha>
                </div>

                @if (invalid('recaptchaToken')) {
                  <div class="alert alert-danger mb-4 d-flex align-items-center">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                    <span>Por favor completa el captcha de seguridad</span>
                  </div>
                }

                @if (errorMessage()) {
                  <div class="alert alert-danger mb-4 d-flex align-items-center">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                    <span>{{ errorMessage() }}</span>
                  </div>
                }

                <button 
                  class="btn btn-primary btn-lg w-100 fw-semibold mb-3" 
                  type="submit" 
                  [disabled]="submitting()">
                  @if (submitting()) {
                    <span class="spinner-border spinner-border-sm me-2"></span>
                    Verificando...
                  } @else {
                    <i class="bi bi-check-circle me-2"></i>
                    Verificar código
                  }
                </button>

                <button 
                  class="btn btn-outline-secondary btn-lg w-100 fw-semibold" 
                  type="button" 
                  (click)="resendCode()"
                  [disabled]="resending()">
                  @if (resending()) {
                    <span class="spinner-border spinner-border-sm me-2"></span>
                    Reenviando...
                  } @else {
                    <i class="bi bi-arrow-clockwise me-2"></i>
                    Reenviar código
                  }
                </button>
              </form>
            </div>
          </div>

          <div class="text-center mt-4">
            <a 
              class="text-light text-decoration-none" 
              href="/auth/login">
              <i class="bi bi-arrow-left me-1"></i>
              Volver al inicio de sesión
            </a>
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

    .email-badge {
      background: var(--bs-secondary-bg);
      color: var(--bs-body-color);
      padding: 0.75rem 1.25rem;
      border-radius: 2rem;
      display: inline-flex;
      align-items: center;
      font-weight: 500;
    }

    .code-input {
      letter-spacing: 0.5rem;
      font-size: 1.5rem;
      font-weight: 600;
      padding: 1rem;
    }

    .code-input:focus {
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

    .btn-outline-secondary {
      border: 2px solid var(--bs-border-color);
      border-radius: 0.5rem;
      padding: 0.75rem 1.5rem;
      transition: all 0.3s ease;
      color: var(--bs-body-color);
    }

    .btn-outline-secondary:hover:not(:disabled) {
      background: var(--bs-secondary-bg);
      border-color: var(--bs-border-color);
      transform: translateY(-2px);
    }

    .form-label {
      color: var(--bs-body-color);
      font-size: 0.9rem;
    }

    .alert-danger {
      border-radius: 0.5rem;
      border: none;
      background-color: rgba(220, 53, 69, 0.1);
      color: var(--bs-danger);
      border: 1px solid var(--bs-danger);
    }

    h1, h2 {
      color: #fff;
    }

    .text-muted {
      color: rgb(255 255 255 / 75%) !important;
    }

    .text-light {
      color: rgba(255, 255, 255, 0.8) !important;
    }

    .text-light:hover {
      color: rgba(255, 255, 255, 1) !important;
    }

    re-captcha {
      display: inline-block;
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

      .code-input {
        font-size: 1.2rem;
        letter-spacing: 0.3rem;
      }

      re-captcha {
        transform: scale(0.85);
        transform-origin: center;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'd-block' },
})
export class TwoFactorComponent {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthService);
  private notify = inject(NotifyService);

  submitting = signal(false);
  resending = signal(false);
  email = signal<string>('');
  errorMessage = signal<string | null>(null);

  form = this.fb.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    recaptchaToken: ['', [Validators.required]],
  });

  constructor() {
    const emailParam = this.route.snapshot.queryParamMap.get('email') ?? '';
    if (!emailParam) {
      this.router.navigate(['/auth/login']);
      return;
    }
    this.email.set(emailParam);
  }

  invalid = (control: keyof typeof this.form.controls) => {
    const c = this.form.controls[control];
    return c.invalid && (c.dirty || c.touched);
  };

  onCaptchaResolved(token: string | null) {
    if (token) {
      this.form.patchValue({ recaptchaToken: token });
      this.errorMessage.set(null);
    }
  }

  onCaptchaError() {
    this.form.patchValue({ recaptchaToken: '' });
    this.notify.error('Error al cargar el captcha. Recarga la página.');
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const code = this.form.controls.code.value ?? '';
    const recaptchaToken = this.form.controls.recaptchaToken.value ?? '';
    const email = this.email();

    this.submitting.set(true);
    this.errorMessage.set(null);

    const auth = this.auth as AuthService & {
      verifyTwoFactorCode: (payload: { 
        email: string; 
        code: string; 
        recaptchaToken: string;
      }) => Promise<void>;
    };

    auth
      .verifyTwoFactorCode({ email, code, recaptchaToken })
      .then(async () => {
        this.submitting.set(false);
        this.notify.success('Inicio de sesión exitoso');
        await this.router.navigate(['/dashboard']);
      })
      .catch((error) => {
        this.submitting.set(false);
        this.form.patchValue({ recaptchaToken: '' });
        
        let message = 'Código inválido o expirado';
        if (error?.error?.message) {
          message = error.error.message;
        } else if (error?.message) {
          message = error.message;
        }
        
        this.errorMessage.set(message);
        this.notify.error(message);
      });
  }

  resendCode() {
    const email = this.email();
    const auth = this.auth as AuthService & {
      resendTwoFactorCode: (email: string) => Promise<void>;
    };

    this.resending.set(true);
    this.errorMessage.set(null);

    auth
      .resendTwoFactorCode(email)
      .then(() => {
        this.resending.set(false);
        this.notify.success('Código reenviado. Revisa tu correo');
        // Reset form
        this.form.patchValue({ code: '', recaptchaToken: '' });
      })
      .catch((error) => {
        this.resending.set(false);
        
        let message = 'No se pudo reenviar el código';
        if (error?.error?.message) {
          message = error.error.message;
        } else if (error?.message) {
          message = error.message;
        }
        
        this.errorMessage.set(message);
        this.notify.error(message);
      });
  }
}