import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EventService } from './services/event.service';
import { NotifyService } from '../core/services/notify.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-event-new',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="container-fluid py-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 class="h4 mb-1">{{ isEditMode() ? 'Editar evento' : 'Crear nuevo evento' }}</h1>
          <p class="text-muted mb-0">{{ isEditMode() ? 'Actualiza los datos del evento' : 'Completa los datos del evento' }}</p>
        </div>
        <a class="btn btn-outline-secondary" [routerLink]="['/events']">
          <i class="bi bi-arrow-left me-1"></i>
          Volver
        </a>
      </div>

      @if (loading()) {
        <div class="text-center py-5">
          <div class="spinner-border text-primary"></div>
        </div>
      }

      @if (!loading()) {
        <div class="row">
          <div class="col-lg-8">
            <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
              <!-- Banner/Foto del evento -->
              <div class="card mb-4">
                <div class="card-body">
                  <h5 class="card-title mb-3">Banner del evento</h5>
                  
                  <div class="mb-3">
                    @if (imagePreview()) {
                      <div class="image-preview-container mb-3">
                        <img [src]="imagePreview()" [alt]="form.value.name || 'Vista previa'" class="image-preview" />
                        <button
                          type="button"
                          class="btn btn-sm btn-danger position-absolute top-0 end-0 m-2"
                          (click)="removeImage()">
                          <i class="bi bi-x-lg"></i>
                        </button>
                      </div>
                    } @else {
                      <div class="image-placeholder">
                        <i class="bi bi-image display-4 text-muted"></i>
                        <p class="text-muted mt-2 mb-0">Banner del evento (Opcional)</p>
                      </div>
                    }
                  </div>

                  <input
                    type="file"
                    class="form-control"
                    accept="image/*"
                    (change)="onFileSelected($event)"
                    [class.is-invalid]="selectedFile() && !isValidImage()" />
                  @if (selectedFile() && !isValidImage()) {
                    <div class="invalid-feedback d-block">
                      La imagen debe ser JPG, PNG o WebP y menor a 5MB
                    </div>
                  }
                  <div class="form-text">
                    Formatos: JPG, PNG, WebP. Tamaño máximo: 5MB. Resolución recomendada: 1200x600px
                  </div>
                </div>
              </div>

              <!-- Información básica -->
              <div class="card mb-4">
                <div class="card-body">
                  <h5 class="card-title mb-3">Información básica</h5>

                  <div class="mb-3">
                    <label for="name" class="form-label">Nombre del evento *</label>
                    <input
                      id="name"
                      type="text"
                      class="form-control"
                      formControlName="name"
                      placeholder="Ej: CarMeet Valle del Cauca 2024"
                      [class.is-invalid]="invalid('name')" />
                    @if (invalid('name')) {
                      <div class="invalid-feedback">El nombre es requerido</div>
                    }
                  </div>

                  <div class="mb-3">
                    <label for="description" class="form-label">Descripción *</label>
                    <textarea
                      id="description"
                      class="form-control"
                      formControlName="description"
                      rows="4"
                      placeholder="Describe el evento..."
                      [class.is-invalid]="invalid('description')"></textarea>
                    @if (invalid('description')) {
                      <div class="invalid-feedback">La descripción es requerida</div>
                    }
                  </div>

                  <div class="mb-3">
                    <label for="location" class="form-label">Ubicación *</label>
                    <input
                      id="location"
                      type="text"
                      class="form-control"
                      formControlName="location"
                      placeholder="Ej: Parque del Perro, Cali"
                      [class.is-invalid]="invalid('location')" />
                    @if (invalid('location')) {
                      <div class="invalid-feedback">La ubicación es requerida</div>
                    }
                  </div>
                </div>
              </div>

              <!-- Fecha y hora -->
              <div class="card mb-4">
                <div class="card-body">
                  <h5 class="card-title mb-3">Fecha y hora</h5>

                  <div class="row">
                    <div class="col-md-6 mb-3">
                      <label for="date" class="form-label">Fecha del evento *</label>
                      <input
                        id="date"
                        type="date"
                        class="form-control"
                        formControlName="date"
                        [class.is-invalid]="invalid('date')" />
                      @if (invalid('date')) {
                        <div class="invalid-feedback">La fecha es requerida</div>
                      }
                    </div>

                    <div class="col-md-6 mb-3">
                      <label for="startTime" class="form-label">Hora de inicio *</label>
                      <input
                        id="startTime"
                        type="time"
                        class="form-control"
                        formControlName="startTime"
                        [class.is-invalid]="invalid('startTime')" />
                      @if (invalid('startTime')) {
                        <div class="invalid-feedback">La hora de inicio es requerida</div>
                      }
                    </div>

                    <div class="col-md-6">
                      <label for="endTime" class="form-label">Hora de finalización</label>
                      <input
                        id="endTime"
                        type="time"
                        class="form-control"
                        formControlName="endTime" />
                      <div class="form-text">Opcional</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Acciones -->
              <div class="d-flex gap-2">
                <button
                  type="submit"
                  class="btn btn-primary"
                  [disabled]="submitting() || (selectedFile() && !isValidImage())">
                  @if (submitting()) {
                    <span class="spinner-border spinner-border-sm me-2"></span>
                    {{ isEditMode() ? 'Actualizando...' : 'Creando...' }}
                  } @else {
                    <i class="bi bi-check-lg me-1"></i>
                    {{ isEditMode() ? 'Actualizar evento' : 'Crear evento' }}
                  }
                </button>
                <a class="btn btn-outline-secondary" [routerLink]="['/events']">
                  Cancelar
                </a>
              </div>
            </form>
          </div>

          <!-- Preview -->
          <div class="col-lg-4">
            <div class="card sticky-top" [style.top.px]="70">
              <div class="card-body">
                <h6 class="card-title mb-3">Vista previa</h6>
                
                @if (imagePreview()) {
                  <div class="preview-banner mb-3">
                    <img [src]="imagePreview()" alt="Preview" class="preview-image" />
                  </div>
                } @else {
                  <div class="preview-banner preview-placeholder mb-3">
                    <i class="bi bi-image text-muted"></i>
                  </div>
                }

                <h6 class="mb-2">{{ form.value.name || 'Nombre del evento' }}</h6>
                <p class="text-muted small mb-2">
                  <i class="bi bi-geo-alt me-1"></i>
                  {{ form.value.location || 'Ubicación' }}
                </p>
                <p class="text-muted small mb-0">
                  {{ form.value.description || 'Descripción del evento...' }}
                </p>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .image-preview-container {
      position: relative;
      width: 100%;
      max-width: 600px;
      aspect-ratio: 2 / 1;
      border-radius: 0.5rem;
      overflow: hidden;
    }

    .image-preview {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .image-placeholder {
      width: 100%;
      max-width: 600px;
      aspect-ratio: 2 / 1;
      border: 2px dashed var(--bs-border-color);
      border-radius: 0.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background-color: var(--bs-light);
    }

    .preview-banner {
      width: 100%;
      aspect-ratio: 2 / 1;
      border-radius: 0.5rem;
      overflow: hidden;
    }

    .preview-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .preview-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--bs-gray-200) 0%, var(--bs-gray-300) 100%);
    }

    .preview-placeholder i {
      font-size: 3rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'd-block' },
})
export class EventNewComponent {
  private fb = inject(FormBuilder);
  private eventService = inject(EventService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private notify = inject(NotifyService);

  submitting = signal(false);
  loading = signal(false);
  selectedFile = signal<File | null>(null);
  imagePreview = signal<string | null>(null);
  eventId = signal<string | null>(null);
  isEditMode = computed(() => !!this.eventId());

  form = this.fb.group({
    name: ['', [Validators.required]],
    description: ['', [Validators.required]],
    location: ['', [Validators.required]],
    date: ['', [Validators.required]],
    startTime: ['', [Validators.required]],
    endTime: [''],
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.eventId.set(id);
      this.loadEvent(id);
    }
  }

  loadEvent(id: string): void {
    this.loading.set(true);
    this.eventService.getEventById(id).subscribe({
      next: (event) => {
        const eventDate = new Date(event.date);
        const startTime = new Date(event.startTime);
        
        this.form.patchValue({
          name: event.name,
          description: event.description,
          location: event.location,
          date: eventDate.toISOString().split('T')[0],
          startTime: startTime.toTimeString().slice(0, 5),
          endTime: event.endTime ? new Date(event.endTime).toTimeString().slice(0, 5) : '',
        });

        if (event.photoUrl) {
          this.imagePreview.set(event.photoUrl);
        }

        this.loading.set(false);
      },
      error: () => {
        Swal.fire({
          title: 'Error',
          text: 'No se pudo cargar el evento',
          icon: 'error',
          confirmButtonColor: '#0d6efd',
        });
        this.loading.set(false);
        this.router.navigate(['/events']);
      },
    });
  }

  invalid = (control: keyof typeof this.form.controls): boolean => {
    const c = this.form.controls[control];
    return c.invalid && (c.dirty || c.touched);
  };

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      this.selectedFile.set(null);
      this.imagePreview.set(null);
      return;
    }

    this.selectedFile.set(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      this.imagePreview.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.selectedFile.set(null);
    if (!this.isEditMode()) {
      this.imagePreview.set(null);
    }
  }

  isValidImage(): boolean {
    const file = this.selectedFile();
    if (!file) return true;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024;

    return validTypes.includes(file.type) && file.size <= maxSize;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      Swal.fire({
        title: 'Formulario incompleto',
        text: 'Por favor completa todos los campos requeridos',
        icon: 'warning',
        confirmButtonColor: '#0d6efd',
      });
      return;
    }

    if (this.selectedFile() && !this.isValidImage()) {
      Swal.fire({
        title: 'Imagen inválida',
        text: 'La imagen debe ser JPG, PNG o WebP y menor a 5MB',
        icon: 'error',
        confirmButtonColor: '#0d6efd',
      });
      return;
    }

    this.submitting.set(true);

    const values = this.form.getRawValue();
    const eventDate = new Date(`${values.date}T${values.startTime}`);
    const startTime = new Date(`${values.date}T${values.startTime}`);
    const endTime = values.endTime ? new Date(`${values.date}T${values.endTime}`) : undefined;

    const basePayload = {
      name: values.name!,
      description: values.description!,
      location: values.location!,
      date: eventDate.toISOString(),
      startTime: startTime.toISOString(),
      endTime: endTime?.toISOString(),
    };

    const payload = this.selectedFile() 
      ? { ...basePayload, photo: this.selectedFile()! }
      : basePayload;

    const request$ = this.isEditMode()
      ? this.eventService.updateEvent(this.eventId()!, payload)
      : this.eventService.createEvent(payload);

    request$.subscribe({
      next: () => {
        const title = this.isEditMode() ? '¡Actualizado!' : '¡Creado!';
        const text = this.isEditMode() 
          ? 'El evento ha sido actualizado exitosamente' 
          : 'El evento ha sido creado exitosamente';

        Swal.fire({
          title,
          text,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
        });

        this.router.navigate(['/events']);
      },
      error: (err) => {
        console.error('Error:', err);
        const message = err?.error?.message || 'Error al procesar el evento';
        
        Swal.fire({
          title: 'Error',
          text: message,
          icon: 'error',
          confirmButtonColor: '#0d6efd',
        });
        
        this.submitting.set(false);
      },
    });
  }
}
