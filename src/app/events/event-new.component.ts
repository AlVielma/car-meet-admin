import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import { ENV } from '../core/config/env';
import { NotifyService } from '../core/services/notify.service';

function notPastDate(ctrl: AbstractControl): ValidationErrors | null {
  const v = ctrl.value as string;
  if (!v) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(v);
  d.setHours(0, 0, 0, 0);
  return d < today ? { pastDate: true } : null;
}
function endAfterStart(group: AbstractControl): ValidationErrors | null {
  const date = group.get('date')?.value as string;
  const start = group.get('startTime')?.value as string;
  const end = group.get('endTime')?.value as string | null;
  if (!date || !start || !end) return null;
  const startDt = new Date(`${date}T${start}:00`);
  const endDt = new Date(`${date}T${end}:00`);
  return endDt <= startDt ? { endBeforeStart: true } : null;
}

@Component({
  selector: 'app-event-new',
  imports: [ReactiveFormsModule],
  template: `
    <h1 class="h4 mb-3">Nuevo evento</h1>
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="vstack gap-3">
      <!-- Nombre -->
      <div class="form-floating">
        <input
          id="name"
          class="form-control"
          type="text"
          placeholder="Nombre"
          formControlName="name"
          [class.is-invalid]="invalid(name)"
        />
        <label for="name">Nombre</label>
        @if (invalid(name)) {
        <div class="invalid-feedback d-block">
          @if (name.errors?.['required']) { El nombre es requerido } @if
          (name.errors?.['minlength']) { Mínimo 3 caracteres } @if (name.errors?.['maxlength']) {
          Máximo 100 caracteres }
        </div>
        }
      </div>

      <!-- Descripción -->
      <div class="form-floating">
        <textarea
          id="description"
          class="form-control"
          placeholder="Descripción"
          style="height: 120px"
          formControlName="description"
          [class.is-invalid]="invalid(description)"
        ></textarea>
        <label for="description">Descripción (opcional)</label>
        @if (invalid(description)) {
        <div class="invalid-feedback d-block">
          @if (description.errors?.['maxlength']) { Máximo 2000 caracteres }
        </div>
        }
      </div>

      <!-- Ubicación -->
      <div class="form-floating">
        <input
          id="location"
          class="form-control"
          type="text"
          placeholder="Ubicación"
          formControlName="location"
          [class.is-invalid]="invalid(location)"
        />
        <label for="location">Ubicación</label>
        @if (invalid(location)) {
        <div class="invalid-feedback d-block">
          @if (location.errors?.['required']) { La ubicación es requerida } @if
          (location.errors?.['minlength']) { Mínimo 3 caracteres } @if
          (location.errors?.['maxlength']) { Máximo 200 caracteres }
        </div>
        }
      </div>

      <!-- Fecha -->
      <div class="form-floating">
        <input
          id="date"
          class="form-control"
          type="date"
          formControlName="date"
          [class.is-invalid]="invalid(date)"
        />
        <label for="date">Fecha</label>
        @if (invalid(date)) {
        <div class="invalid-feedback d-block">
          @if (date.errors?.['required']) { La fecha es requerida } @if (date.errors?.['pastDate'])
          { La fecha no puede ser en el pasado }
        </div>
        }
      </div>

      <!-- Hora inicio -->
      <div class="form-floating">
        <input
          id="startTime"
          class="form-control"
          type="time"
          formControlName="startTime"
          [class.is-invalid]="invalid(startTime) || form.errors?.['endBeforeStart']"
        />
        <label for="startTime">Hora de inicio</label>
        @if (invalid(startTime)) {
        <div class="invalid-feedback d-block">
          @if (startTime.errors?.['required']) { La hora de inicio es requerida }
        </div>
        }
      </div>

      <!-- Hora fin (opcional) -->
      <div class="form-floating">
        <input
          id="endTime"
          class="form-control"
          type="time"
          formControlName="endTime"
          [class.is-invalid]="form.errors?.['endBeforeStart']"
        />
        <label for="endTime">Hora de fin (opcional)</label>
        @if (form.errors?.['endBeforeStart']) {
        <div class="invalid-feedback d-block">La hora de fin debe ser posterior a la de inicio</div>
        }
      </div>

      <button class="btn btn-primary" type="submit" [disabled]="submitting()">Crear evento</button>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'd-block py-4' },
})
export class EventNewComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);
  private notify = inject(NotifyService);

  submitting = signal(false);

  form = this.fb.nonNullable.group(
    {
      name: this.fb.nonNullable.control('', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100),
      ]),
      description: this.fb.nonNullable.control('', [Validators.maxLength(2000)]),
      location: this.fb.nonNullable.control('', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(200),
      ]),
      date: this.fb.nonNullable.control('', [Validators.required, notPastDate]),
      startTime: this.fb.nonNullable.control('', [Validators.required]),
      endTime: this.fb.control<string | null>(null),
    },
    { validators: [endAfterStart] }
  );

  get name(): AbstractControl {
    return this.form.controls['name'];
  }
  get description(): AbstractControl {
    return this.form.controls['description'];
  }
  get location(): AbstractControl {
    return this.form.controls['location'];
  }
  get date(): AbstractControl {
    return this.form.controls['date'];
  }
  get startTime(): AbstractControl {
    return this.form.controls['startTime'];
  }
  get endTime(): AbstractControl {
    return this.form.controls['endTime'];
  }

  invalid(ctrl: AbstractControl) {
    return ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notify.warning('Revisa los campos del formulario.');
      return;
    }
    const { name, description, location, date, startTime, endTime } = this.form.getRawValue();
    const payload = {
      name,
      description: description?.trim() || undefined,
      location,
      date: new Date(date).toISOString(),
      startTime: new Date(`${date}T${startTime}:00`).toISOString(),
      ...(endTime ? { endTime: new Date(`${date}T${endTime}:00`).toISOString() } : {}),
    };

    this.submitting.set(true);
    this.http.post(`${ENV.apiBaseUrl}/events`, payload).subscribe({
      next: async () => {
        this.submitting.set(false);
        this.notify.success('Evento creado exitosamente.');
        await this.router.navigate(['/events']);
      },
      error: () => {
        this.submitting.set(false);
        this.notify.error('No se pudo crear el evento.');
      },
    });
  }
}
