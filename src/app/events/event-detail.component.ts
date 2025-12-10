import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe, NgOptimizedImage } from '@angular/common';
import { EventService } from './services/event.service';
import { NotifyService } from '../core/services/notify.service';
import type { Event } from './models/event.models';

@Component({
  selector: 'app-event-detail',
  imports: [RouterLink, DatePipe, NgOptimizedImage],
  template: `
    <div class="container-fluid py-4">
      @if (loading()) {
        <div class="text-center py-5">
          <div class="spinner-border text-primary"></div>
        </div>
      }

      @if (!loading() && event()) {
        <div class="row">
          <div class="col-lg-8">
            <!-- Banner -->
            @if (event()!.photoUrl) {
              <div class="event-banner-large mb-4">
                <img
                  [ngSrc]="event()!.photoUrl || ''"
                  [alt]="event()!.name"
                  fill
                  priority
                  class="banner-image" />
                <div class="banner-overlay">
                  <span
                    class="badge position-absolute top-0 end-0 m-3"
                    [class.bg-success]="event()!.status === 'ACTIVE'"
                    [class.bg-primary]="event()!.status === 'FINISHED'"
                    [class.bg-danger]="event()!.status === 'CANCELLED'">
                    {{ statusLabel(event()!.status) }}
                  </span>
                </div>
              </div>
            }

            <!-- Información -->
            <div class="card mb-4">
              <div class="card-body">
                <h1 class="h3 mb-3">{{ event()!.name }}</h1>
                
                <div class="event-meta mb-4">
                  <p class="mb-2">
                    <i class="bi bi-calendar3 me-2 text-primary"></i>
                    <strong>Fecha:</strong> {{ event()!.date | date: 'dd/MM/yyyy HH:mm' }}
                  </p>
                  <p class="mb-2">
                    <i class="bi bi-geo-alt me-2 text-primary"></i>
                    <strong>Ubicación:</strong> {{ event()!.location }}
                  </p>
                  <p class="mb-0">
                    <i class="bi bi-people me-2 text-primary"></i>
                    <strong>Participantes:</strong> 
                    {{ event()!._count?.participants || 0 }} / {{ event()!.max_participants }}
                  </p>
                </div>

                <hr />

                <h5 class="mb-3">Descripción</h5>
                <p class="text-muted">{{ event()!.description }}</p>
              </div>
            </div>

            <!-- Acciones -->
            <div class="d-flex gap-2">
              <a class="btn btn-outline-secondary" [routerLink]="['/events']">
                <i class="bi bi-arrow-left me-1"></i>
                Volver
              </a>
              <a class="btn btn-primary" [routerLink]="['/events', event()!.id, 'edit']">
                <i class="bi bi-pencil me-1"></i>
                Editar
              </a>
              <button
                type="button"
                class="btn btn-outline-danger"
                (click)="deleteEvent()">
                <i class="bi bi-trash me-1"></i>
                Eliminar
              </button>
            </div>
          </div>

          <!-- Sidebar -->
          <div class="col-lg-4">
            <div class="card sticky-top" [style.top.px]="20">
              <div class="card-body">
                <h6 class="card-title mb-3">Detalles del evento</h6>
                
                <ul class="list-unstyled">
                  <li class="mb-3">
                    <small class="text-muted d-block">Estado</small>
                    <span
                      class="badge"
                      [class.bg-success]="event()!.status === 'ACTIVE'"
                      [class.bg-primary]="event()!.status === 'FINISHED'"
                      [class.bg-danger]="event()!.status === 'CANCELLED'">
                      {{ statusLabel(event()!.status) }}
                    </span>
                  </li>
                  <li class="mb-3">
                    <small class="text-muted d-block">Creado</small>
                    <strong>{{ event()!.createdAt | date: 'dd/MM/yyyy HH:mm' }}</strong>
                  </li>
                  <li class="mb-3">
                    <small class="text-muted d-block">Última actualización</small>
                    <strong>{{ event()!.updatedAt | date: 'dd/MM/yyyy HH:mm' }}</strong>
                  </li>
                  @if (event()!.organizer) {
                    <li>
                      <small class="text-muted d-block">Organizador</small>
                      <strong>{{ event()!.organizer!.firstName }} {{ event()!.organizer!.lastName }}</strong>
                      <div class="text-muted small">{{ event()!.organizer!.email }}</div>
                    </li>
                  }
                </ul>
              </div>
            </div>
          </div>
        </div>
      }

      @if (!loading() && !event()) {
        <div class="text-center py-5">
          <i class="bi bi-exclamation-circle display-1 text-muted"></i>
          <p class="text-muted mt-3">Evento no encontrado</p>
          <a class="btn btn-primary" [routerLink]="['/events']">Volver a eventos</a>
        </div>
      }
    </div>
  `,
  styles: [`
    .event-banner-large {
      position: relative;
      width: 100%;
      height: 400px;
      border-radius: 0.5rem;
      overflow: hidden;
    }

    .banner-image {
      object-fit: cover;
    }

    .banner-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.2) 100%);
    }

    .event-meta {
      border-left: 3px solid var(--bs-primary);
      padding-left: 1rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'd-block' },
})
export class EventDetailComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private eventService = inject(EventService);
  private notify = inject(NotifyService);

  event = signal<Event | null>(null);
  loading = signal(true);

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadEvent(id);
    }
  }

  loadEvent(id: string) {
    this.loading.set(true);
    this.eventService.getEventById(id).subscribe({
      next: (event) => {
        this.event.set(event);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar evento:', err);
        this.notify.error('Error al cargar el evento');
        this.loading.set(false);
      },
    });
  }

  deleteEvent() {
    if (!confirm('¿Eliminar este evento?')) return;
    
    this.eventService.deleteEvent(this.event()!.id.toString()).subscribe({
      next: () => {
        this.notify.success('Evento eliminado');
        this.router.navigate(['/events']);
      },
      error: () => this.notify.error('Error al eliminar evento'),
    });
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      DRAFT: 'Borrador',
      ACTIVE: 'Activo',
      FINISHED: 'Completado',
      CANCELLED: 'Cancelado',
    };
    return labels[status] || status;
  }
}