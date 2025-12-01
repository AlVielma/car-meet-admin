import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import { ENV } from '../core/config/env';
import { NotifyService } from '../core/services/notify.service';

type EventDetail = {
  id: number;
  name: string;
  description: string | null;
  location: string;
  date: string;
  startTime: string;
  endTime: string | null;
  status: 'ACTIVE' | 'CANCELLED' | 'FINISHED' | string;
};

function endAfterStartOptional(group: AbstractControl): ValidationErrors | null {
  const date = group.get('date')?.value as string | null;
  const start = group.get('startTime')?.value as string | null;
  const end = group.get('endTime')?.value as string | null;
  if (!date || !start || !end) return null;
  const startDt = new Date(`${date}T${start}:00`);
  const endDt = new Date(`${date}T${end}:00`);
  return endDt <= startDt ? { endBeforeStart: true } : null;
}

@Component({
  selector: 'app-event-detail',
  imports: [ReactiveFormsModule],
  template: `
    <h1 class="h5 mb-3">Editar evento</h1>
    @if (loading()) {
    <div class="spinner-border"></div>
    } @if (!loading()) {
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="vstack gap-3">
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
          @if (name.errors?.['minlength']) { Mínimo 3 caracteres } @if (name.errors?.['maxlength'])
          { Máximo 100 caracteres }
        </div>
        }
      </div>

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
          @if (location.errors?.['minlength']) { Mínimo 3 caracteres } @if
          (location.errors?.['maxlength']) { Máximo 200 caracteres }
        </div>
        }
      </div>

      <div class="form-floating">
        <input id="date" class="form-control" type="date" formControlName="date" />
        <label for="date">Fecha (opcional)</label>
      </div>

      <div class="form-floating">
        <input
          id="startTime"
          class="form-control"
          type="time"
          formControlName="startTime"
          [class.is-invalid]="form.errors?.['endBeforeStart']"
        />
        <label for="startTime">Hora de inicio (opcional)</label>
      </div>

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

      <div class="form-floating">
        <select id="status" class="form-select" formControlName="status">
          <option value="">Sin cambio</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="CANCELLED">CANCELLED</option>
          <option value="FINISHED">FINISHED</option>
        </select>
        <label for="status">Estado</label>
      </div>

      <div class="d-flex gap-2">
        <button class="btn btn-primary" type="submit" [disabled]="submitting()">Guardar</button>
        <button
          type="button"
          class="btn btn-outline-warning"
          (click)="cancelEvent()"
          [disabled]="currentStatus() !== 'ACTIVE'"
        >
          Cancelar evento
        </button>
        <button type="button" class="btn btn-outline-danger ms-auto" (click)="deleteEvent()">
          Eliminar
        </button>
      </div>
    </form>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'd-block py-4' },
})
export class EventDetailComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private notify = inject(NotifyService);

  loading = signal(true);
  submitting = signal(false);
  id = signal<number>(0);
  currentStatus = signal<'ACTIVE' | 'CANCELLED' | 'FINISHED' | string>('ACTIVE');

  form = this.fb.group(
    {
      name: ['', [Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(2000)]],
      location: ['', [Validators.minLength(3), Validators.maxLength(200)]],
      date: [''],
      startTime: [''],
      endTime: [''],
      status: [''],
    },
    { validators: [endAfterStartOptional] }
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
  get status(): AbstractControl {
    return this.form.controls['status'];
  }

  invalid(ctrl: AbstractControl) {
    return ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }

  private toDateInput(iso: string) {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`;
  }
  private toTimeInput(iso: string) {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  constructor() {
    const idParam = parseInt(this.route.snapshot.params['id'], 10);
    this.id.set(idParam);
    this.fetch();
  }

  fetch() {
    this.loading.set(true);
    this.http
      .get<{ success: boolean; message: string; data: EventDetail }>(
        `${ENV.apiBaseUrl}/events/${this.id()}`
      )
      .subscribe({
        next: (resp) => {
          const e = resp?.data;
          if (e) {
            this.currentStatus.set(e.status);
            this.form.patchValue({
              name: e.name,
              description: e.description ?? '',
              location: e.location,
              date: this.toDateInput(e.date),
              startTime: this.toTimeInput(e.startTime),
              endTime: e.endTime ? this.toTimeInput(e.endTime) : '',
              status: '',
            });
          }
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.notify.error('No se pudo cargar el evento.');
        },
      });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notify.warning('Revisa los campos del formulario.');
      return;
    }
    const { name, description, location, date, startTime, endTime, status } =
      this.form.getRawValue();
    const payload: any = {};
    if (name?.trim()) payload.name = name.trim();
    if (description !== undefined) payload.description = description?.trim() || null;
    if (location?.trim()) payload.location = location.trim();
    if (date) payload.date = new Date(date).toISOString();
    if (date && startTime) payload.startTime = new Date(`${date}T${startTime}:00`).toISOString();
    if (date && endTime) payload.endTime = new Date(`${date}T${endTime}:00`).toISOString();
    if (status) payload.status = status;

    this.submitting.set(true);
    this.http.put(`${ENV.apiBaseUrl}/events/${this.id()}`, payload).subscribe({
      next: async () => {
        this.submitting.set(false);
        this.notify.success('Evento actualizado.');
        await this.router.navigate(['/events']);
      },
      error: () => {
        this.submitting.set(false);
        this.notify.error('No se pudo actualizar el evento.');
      },
    });
  }

  cancelEvent() {
    Swal.fire({
      title: '¿Cancelar evento?',
      text: 'Se marcará como CANCELLED.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'Volver',
      confirmButtonColor: '#fd7e14',
      cancelButtonColor: '#6c757d',
      reverseButtons: true,
    }).then((result) => {
      if (!result.isConfirmed) return;
      this.http.patch(`${ENV.apiBaseUrl}/events/${this.id()}/cancel`, {}).subscribe({
        next: async () => {
          this.notify.success('Evento cancelado.');
          await this.router.navigate(['/events']);
        },
        error: () => this.notify.error('No se pudo cancelar el evento.'),
      });
    });
  }

  deleteEvent() {
    Swal.fire({
      title: '¿Eliminar evento?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Volver',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      reverseButtons: true,
    }).then((result) => {
      if (!result.isConfirmed) return;
      this.http.delete(`${ENV.apiBaseUrl}/events/${this.id()}`).subscribe({
        next: async () => {
          this.notify.success('Evento eliminado.');
          await this.router.navigate(['/events']);
        },
        error: () => this.notify.error('No se pudo eliminar el evento.'),
      });
    });
  }
}
