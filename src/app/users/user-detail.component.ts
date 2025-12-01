import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ENV } from '../core/config/env';
import { NotifyService } from '../core/services/notify.service';

type UserDetailResponse = { success: boolean; message: string; data: any };

@Component({
  selector: 'app-user-detail',
  imports: [ReactiveFormsModule],
  template: `
    <h1 class="h5 mb-3">Editar usuario</h1>
    @if (loading()) {
    <div class="spinner-border"></div>
    } @if (!loading()) {
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="vstack gap-3">
      <!-- Nombre -->
      <div class="form-floating">
        <input
          id="firstName"
          class="form-control"
          type="text"
          placeholder="Nombre"
          formControlName="firstName"
          [class.is-invalid]="invalid(firstName)"
        />
        <label for="firstName">Nombre</label>
        @if (invalid(firstName)) {
        <div class="invalid-feedback d-block">
          @if (firstName.errors?.['minlength']) { Mínimo 2 caracteres } @if
          (firstName.errors?.['maxlength']) { Máximo 50 caracteres }
        </div>
        }
      </div>

      <!-- Apellido -->
      <div class="form-floating">
        <input
          id="lastName"
          class="form-control"
          type="text"
          placeholder="Apellido"
          formControlName="lastName"
          [class.is-invalid]="invalid(lastName)"
        />
        <label for="lastName">Apellido</label>
        @if (invalid(lastName)) {
        <div class="invalid-feedback d-block">
          @if (lastName.errors?.['minlength']) { Mínimo 2 caracteres } @if
          (lastName.errors?.['maxlength']) { Máximo 50 caracteres }
        </div>
        }
      </div>

      <!-- Correo -->
      <div class="form-floating">
        <input
          id="email"
          class="form-control"
          type="email"
          inputmode="email"
          placeholder="name@example.com"
          formControlName="email"
          [class.is-invalid]="invalid(email)"
          autocomplete="email"
        />
        <label for="email">Correo</label>
        @if (invalid(email)) {
        <div class="invalid-feedback d-block">
          @if (email.errors?.['email']) { Debe ser un correo válido }
        </div>
        }
      </div>

      <!-- Teléfono (opcional) -->
      <div class="form-floating">
        <input
          id="phone"
          class="form-control"
          type="text"
          inputmode="numeric"
          pattern="^[0-9]{10}$"
          maxlength="10"
          placeholder="5512345678"
          formControlName="phone"
          [class.is-invalid]="invalid(phone)"
          (input)="keepDigitsOnly('phone')"
          autocomplete="tel"
        />
        <label for="phone">Teléfono (10 dígitos)</label>
        @if (invalid(phone)) {
        <div class="invalid-feedback d-block">
          @if (phone.errors?.['pattern']) { El teléfono debe tener 10 dígitos numéricos }
        </div>
        }
      </div>

      <!-- Contraseña (opcional, no enviar si está vacía) -->
      <div class="form-floating">
        <input
          id="password"
          class="form-control"
          type="password"
          placeholder="Nueva contraseña"
          formControlName="password"
          [class.is-invalid]="invalid(password)"
          autocomplete="new-password"
        />
        <label for="password">Nueva contraseña (opcional)</label>
        @if (invalid(password)) {
        <div class="invalid-feedback d-block">
          @if (password.errors?.['minlength']) { Al menos 8 caracteres } @if
          (password.errors?.['pattern']) { Debe contener una mayúscula, una minúscula, un número y
          un carácter especial (@$!%*?&.#_-) }
        </div>
        }
      </div>

      <!-- Rol ID -->
      <div class="form-floating">
        <input
          id="roleId"
          class="form-control"
          type="number"
          min="1"
          step="1"
          placeholder="Rol ID"
          formControlName="roleId"
          [class.is-invalid]="invalid(roleId)"
        />
        <label for="roleId">Rol ID</label>
        @if (invalid(roleId)) {
        <div class="invalid-feedback d-block">
          @if (roleId.errors?.['min']) { El rol debe ser un entero positivo }
        </div>
        }
      </div>

      <button class="btn btn-primary" type="submit" [disabled]="submitting()">
        Guardar cambios
      </button>
    </form>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'd-block py-4' },
})
export class UserDetailComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private notify = inject(NotifyService);

  submitting = signal(false);
  loading = signal(true);
  id = signal<number>(0);

  form = this.fb.group({
    firstName: ['', [Validators.minLength(2), Validators.maxLength(50)]],
    lastName: ['', [Validators.minLength(2), Validators.maxLength(50)]],
    email: ['', [Validators.email]],
    phone: ['', [Validators.pattern(/^[0-9]{10}$/)]],
    password: [
      '',
      [
        Validators.minLength(8),
        Validators.pattern(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#_\-])[A-Za-z\d@$!%*?&.#_\-]{8,}$/
        ),
      ],
    ],
    roleId: [1, [Validators.min(1)]],
  });

  // Helpers acceso/validación
  get firstName(): AbstractControl {
    return this.form.controls['firstName'];
  }
  get lastName(): AbstractControl {
    return this.form.controls['lastName'];
  }
  get email(): AbstractControl {
    return this.form.controls['email'];
  }
  get phone(): AbstractControl {
    return this.form.controls['phone'];
  }
  get password(): AbstractControl {
    return this.form.controls['password'];
  }
  get roleId(): AbstractControl {
    return this.form.controls['roleId'];
  }

  invalid(ctrl: AbstractControl): boolean {
    return ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }

  keepDigitsOnly(controlName: 'phone') {
    const v = this.form.controls[controlName].value ?? '';
    const digits = String(v).replace(/\D+/g, '').slice(0, 10);
    if (digits !== v) this.form.controls[controlName].setValue(digits);
  }

  constructor() {
    const idParam = parseInt(this.route.snapshot.params['id'], 10);
    this.id.set(idParam);
    this.fetchUser();
  }

  fetchUser() {
    this.loading.set(true);
    this.http.get<UserDetailResponse>(`${ENV.apiBaseUrl}/users/${this.id()}`).subscribe({
      next: (resp) => {
        const user = resp?.data;
        if (user) {
          this.form.patchValue({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone ?? '',
            roleId: user.role?.id ?? 1,
          });
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notify.error('No se pudo cargar el usuario.');
      },
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notify.warning('Revisa los campos del formulario.');
      return;
    }
    this.submitting.set(true);
    const payload = this.form.getRawValue() as {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      password?: string;
      roleId?: number;
    };

    // No enviar password vacía
    if (!payload.password || payload.password.trim().length === 0) {
      delete payload.password;
    }

    this.http.put(`${ENV.apiBaseUrl}/users/${this.id()}`, payload).subscribe({
      next: async () => {
        this.submitting.set(false);
        this.notify.success('Usuario actualizado exitosamente.');
        await this.router.navigate(['/users']);
      },
      error: () => {
        this.submitting.set(false);
        this.notify.error('No se pudo actualizar el usuario.');
      },
    });
  }
}
