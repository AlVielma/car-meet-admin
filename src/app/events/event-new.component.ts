import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { EventService } from './services/event.service';
import { NotifyService } from '../core/services/notify.service';

// Validador personalizado
function endTimeValidator(control: AbstractControl): ValidationErrors | null {
  const startTime = control.get('startTime')?.value;
  const endTime = control.get('endTime')?.value;

  if (!startTime || !endTime) {
    return null;
  }

  return startTime < endTime ? null : { endTimeInvalid: true };
}

@Component({
  selector: 'app-event-new',
  imports: [RouterLink, ReactiveFormsModule],
  template: `
    <div class="container-fluid py-4">
      <div class="row justify-content-center">
        <div class="col-12 col-lg-8">
          <a class="btn btn-sm btn-outline-secondary mb-3" routerLink="/events">
            <i class="bi bi-arrow-left me-1"></i>
            Volver
          </a>

          <div class="card shadow-sm">
            <div class="card-header">
              <h1 class="h5 mb-0">
                {{ isEdit() ? 'Editar evento' : 'Crear evento' }}
              </h1>
            </div>
            <div class="card-body">
              <form [formGroup]="form" (ngSubmit)="onSubmit()">
                <div class="mb-3">
                  <label class="form-label">Título *</label>
                  <input
                    type="text"
                    class="form-control"
                    formControlName="name"
                    [class.is-invalid]="form.controls.name.invalid && form.controls.name.touched"
                  />
                  @if (form.controls.name.invalid && form.controls.name.touched) {
                  <div class="invalid-feedback">El título es requerido</div>
                  }
                </div>

                <div class="mb-3">
                  <label class="form-label">Descripción *</label>
                  <textarea
                    class="form-control"
                    rows="4"
                    formControlName="description"
                    [class.is-invalid]="
                      form.controls.description.invalid && form.controls.description.touched
                    "
                  ></textarea>
                  @if (form.controls.description.invalid && form.controls.description.touched) {
                  <div class="invalid-feedback">La descripción es requerida</div>
                  }
                </div>

                <div class="mb-3">
                  <label class="form-label">Fecha *</label>
                  <input
                    type="date"
                    class="form-control"
                    formControlName="date"
                    [class.is-invalid]="form.controls.date.invalid && form.controls.date.touched"
                  />
                  @if (form.controls.date.invalid && form.controls.date.touched) {
                  <div class="invalid-feedback">La fecha es requerida</div>
                  }
                </div>

                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Hora de inicio *</label>
                    <input
                      type="time"
                      class="form-control"
                      formControlName="startTime"
                      [class.is-invalid]="
                        form.controls.startTime.invalid && form.controls.startTime.touched
                      "
                    />
                    @if (form.controls.startTime.invalid && form.controls.startTime.touched) {
                    <div class="invalid-feedback">La hora de inicio es requerida</div>
                    }
                  </div>

                  <div class="col-md-6 mb-3">
                    <label class="form-label">Hora de fin *</label>
                    <input
                      type="time"
                      class="form-control"
                      formControlName="endTime"
                      [class.is-invalid]="
          (form.controls.endTime.invalid && form.controls.endTime.touched) ||
          (form.errors?.['endTimeInvalid'] && form.controls.endTime.touched)
        "
                    />
                    @if (form.controls.endTime.invalid && form.controls.endTime.touched) {
                    <div class="invalid-feedback">La hora de fin es requerida</div>
                    } @if (form.errors?.['endTimeInvalid'] && form.controls.endTime.touched) {
                    <div class="invalid-feedback">
                      La hora de fin debe ser posterior a la hora de inicio
                    </div>
                    }
                  </div>
                </div>

                <div class="mb-3">
                  <label class="form-label">Ubicación *</label>
                  <input
                    type="text"
                    class="form-control"
                    formControlName="location"
                    [class.is-invalid]="
                      form.controls.location.invalid && form.controls.location.touched
                    "
                  />
                  @if (form.controls.location.invalid && form.controls.location.touched) {
                  <div class="invalid-feedback">La ubicación es requerida</div>
                  }
                </div>

                @if (isEdit()) {
                <div class="mb-3">
                  <label class="form-label">Estado</label>
                  <select class="form-select" formControlName="status">
                    <option value="ACTIVE">Activo</option>
                    <option value="FINISHED">Finalizado</option>
                    <option value="CANCELLED">Cancelado</option>
                  </select>
                </div>
                }

                <div class="d-flex gap-2">
                  <button
                    class="btn btn-primary"
                    type="submit"
                    [disabled]="form.invalid || submitting()"
                  >
                    @if (submitting()) {
                    <span class="spinner-border spinner-border-sm me-1" role="status"></span>
                    }
                    {{ isEdit() ? 'Actualizar' : 'Crear' }}
                  </button>
                  <a class="btn btn-outline-secondary" routerLink="/events"> Cancelar </a>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'd-block' },
})
export class EventNewComponent {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private eventService = inject(EventService);
  private notify = inject(NotifyService);

  isEdit = signal(false);
  submitting = signal(false);
  eventId: string | null = null;

  form = this.fb.nonNullable.group(
    {
      name: ['', Validators.required],
      description: ['', Validators.required],
      date: ['', Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      location: ['', Validators.required],
      status: ['ACTIVE' as 'ACTIVE' | 'FINISHED' | 'CANCELLED'],
    },
    { validators: endTimeValidator }
  );

  constructor() {
    this.eventId = this.route.snapshot.paramMap.get('id');
    if (this.eventId) {
      this.isEdit.set(true);
      this.loadEvent(this.eventId);
    }
  }

  loadEvent(id: string) {
    this.eventService.getEventById(id).subscribe({
      next: (event: any) => {
        // Extraer fecha y horas del formato "2025-12-01 01:16:38.322"
        const [datePart, timePart] = event.date.split(' ');
        const [hours, minutes] = timePart.split(':');
        const startTime = `${hours}:${minutes}`;

        // Para end_time, si existe
        let endTime = '';
        if (event.end_time) {
          const [, endTimePart] = event.end_time.split(' ');
          const [endHours, endMinutes] = endTimePart.split(':');
          endTime = `${endHours}:${endMinutes}`;
        }

        this.form.patchValue({
          name: event.name,
          description: event.description,
          date: datePart,
          startTime: startTime,
          endTime: endTime,
          location: event.location,
          status: event.status,
        });
      },
      error: () => this.notify.error('Error al cargar evento'),
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const formData = this.form.getRawValue();

    // Combinar fecha y horas en formato "YYYY-MM-DD HH:MM:SS.000"
    const startDateTime = `${formData.date} ${formData.startTime}:00.000`;
    const endDateTime = `${formData.date} ${formData.endTime}:00.000`;

    const data = {
      name: formData.name,
      description: formData.description,
      date: startDateTime,
      startTime: startDateTime,
      endTime: endDateTime,
      location: formData.location,
      status: formData.status,
    };

    const request = this.isEdit()
      ? this.eventService.updateEvent(this.eventId!, data)
      : this.eventService.createEvent(data);

    request.subscribe({
      next: () => {
        this.notify.success(this.isEdit() ? 'Evento actualizado' : 'Evento creado');
        this.router.navigate(['/events']);
      },
      error: () => {
        this.notify.error('Error al guardar evento');
        this.submitting.set(false);
      },
    });
  }
}
