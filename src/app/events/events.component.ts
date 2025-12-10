import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  computed,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgOptimizedImage, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventService } from './services/event.service';
import { NotifyService } from '../core/services/notify.service';
import type { Event, EventFilters } from './models/event.models';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-events',
  imports: [RouterLink, FormsModule, DatePipe, NgOptimizedImage],
  template: `
    <div class="container-fluid py-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h1 class="h4 mb-0">Eventos</h1>
        <a class="btn btn-primary" [routerLink]="['/events/new']">
          <i class="bi bi-plus-circle me-1"></i>
          Crear evento
        </a>
      </div>

      <!-- Filtros -->
      <div class="card mb-4">
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-4">
              <label class="form-label">Buscar</label>
              <input
                type="text"
                class="form-control"
                placeholder="Título, ubicación..."
                [(ngModel)]="filters.search"
                (input)="applyFilters()" />
            </div>
            <div class="col-md-3">
              <label class="form-label">Estado</label>
              <select
                class="form-select"
                [(ngModel)]="filters.status"
                (change)="applyFilters()">
                <option value="">Todos</option>
                <option value="ACTIVE">Activo</option>
                <option value="FINISHED">Completado</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
            </div>
            <div class="col-md-5 d-flex align-items-end gap-2">
              <button
                class="btn btn-outline-secondary"
                type="button"
                (click)="resetFilters()">
                <i class="bi bi-arrow-clockwise me-1"></i>
                Limpiar
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Cargando...</span>
          </div>
        </div>
      }

      @if (!loading() && events().length > 0) {
        <div class="row g-3">
          @for (event of events(); track event.id) {
            <div class="col-12 col-lg-6">
              <div class="card event-card shadow-sm h-100">
                <!-- Banner del evento -->
                @if (event.photoUrl) {
                  <div class="event-banner">
                    <img
                      [ngSrc]="event.photoUrl"
                      [alt]="event.name"
                      fill
                      priority
                      class="event-image" />
                    <div class="event-overlay">
                      <span
                        class="badge position-absolute top-0 end-0 m-3"
                        [class.bg-success]="event.status === 'ACTIVE'"
                        [class.bg-primary]="event.status === 'FINISHED'"
                        [class.bg-danger]="event.status === 'CANCELLED'">
                        {{ statusLabel(event.status) }}
                      </span>
                    </div>
                  </div>
                } @else {
                  <div class="event-banner event-placeholder">
                    <i class="bi bi-calendar-event placeholder-icon"></i>
                    <span
                      class="badge position-absolute top-0 end-0 m-3"
                      [class.bg-success]="event.status === 'ACTIVE'"
                      [class.bg-primary]="event.status === 'FINISHED'"
                      [class.bg-danger]="event.status === 'CANCELLED'">
                      {{ statusLabel(event.status) }}
                    </span>
                  </div>
                }

                <div class="card-body">
                  <h5 class="card-title mb-3">{{ event.name }}</h5>

                  <div class="event-info mb-3">
                    <p class="text-muted small mb-2">
                      <i class="bi bi-calendar3 me-2"></i>
                      {{ event.date | date: 'dd/MM/yyyy HH:mm' }}
                    </p>
                    <p class="text-muted small mb-2">
                      <i class="bi bi-geo-alt me-2"></i>
                      {{ event.location }}
                    </p>
                    <p class="text-muted small mb-0">
                      <i class="bi bi-people me-2"></i>
                      {{ event._count?.participants || 0 }} participantes
                    </p>
                  </div>

                  <p class="card-text text-truncate mb-3">
                    {{ event.description }}
                  </p>

                  <div class="d-flex gap-2">
                    <a
                      class="btn btn-sm btn-outline-primary"
                      [routerLink]="['/events', event.id]">
                      <i class="bi bi-eye me-1"></i>
                      Ver detalle
                    </a>
                    <button
                      class="btn btn-sm btn-outline-danger"
                      type="button"
                      (click)="deleteEvent(event)">
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Paginación -->
        @if (totalPages() > 1) {
          <nav class="mt-4">
            <ul class="pagination justify-content-center">
              <li class="page-item" [class.disabled]="currentPage() === 1">
                <button
                  class="page-link"
                  type="button"
                  (click)="goToPage(currentPage() - 1)">
                  Anterior
                </button>
              </li>
              @for (page of pages(); track page) {
                <li
                  class="page-item"
                  [class.active]="page === currentPage()">
                  <button
                    class="page-link"
                    type="button"
                    (click)="goToPage(page)">
                    {{ page }}
                  </button>
                </li>
              }
              <li
                class="page-item"
                [class.disabled]="currentPage() === totalPages()">
                <button
                  class="page-link"
                  type="button"
                  (click)="goToPage(currentPage() + 1)">
                  Siguiente
                </button>
              </li>
            </ul>
          </nav>
        }
      }

      <!-- Empty -->
      @if (!loading() && events().length === 0) {
        <div class="text-center py-5">
          <i class="bi bi-calendar-x display-1 text-muted"></i>
          <p class="text-muted mt-3">No hay eventos disponibles</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .event-card {
      overflow: hidden;
      transition: transform 0.2s ease;
    }

    .event-card:hover {
      transform: translateY(-4px);
    }

    .event-banner {
      position: relative;
      width: 100%;
      height: 200px;
      background: linear-gradient(135deg, var(--bs-gray-200) 0%, var(--bs-gray-300) 100%);
      overflow: hidden;
    }

    .event-image {
      object-fit: cover;
    }

    .event-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.1) 100%);
    }

    .event-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--bs-gray-300) 0%, var(--bs-gray-400) 100%);
    }

    .placeholder-icon {
      font-size: 4rem;
      color: var(--bs-gray-500);
      opacity: 0.5;
    }

    .event-info {
      border-left: 3px solid var(--bs-primary);
      padding-left: 1rem;
    }

    .card-text {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'd-block' },
})
export class EventsComponent {
  private eventService = inject(EventService);
  private notify = inject(NotifyService);

  events = signal<Event[]>([]);
  loading = signal(true);
  currentPage = signal(1);
  totalPages = signal(1);
  filters: EventFilters = { page: 1, limit: 10 };

  pages = computed(() => {
    const total = this.totalPages();
    return Array.from({ length: total }, (_, i) => i + 1);
  });

  constructor() {
    this.loadEvents();
  }

  loadEvents() {
    this.loading.set(true);
    this.eventService.getEvents(this.filters).subscribe({
      next: (res) => {
        if (!res || !res.data || !res.pagination) {
          console.error('Respuesta inválida de la API:', res);
          this.events.set([]);
          this.currentPage.set(1);
          this.totalPages.set(1);
          this.notify.error('Error en la respuesta del servidor');
          this.loading.set(false);
          return;
        }

        this.events.set(res.data);
        this.currentPage.set(res.pagination.page);
        this.totalPages.set(res.pagination.totalPages);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar eventos:', err);
        this.events.set([]);
        this.currentPage.set(1);
        this.totalPages.set(1);
        this.notify.error('Error al cargar eventos');
        this.loading.set(false);
      },
    });
  }

  applyFilters() {
    this.filters.page = 1;
    this.loadEvents();
  }

  resetFilters() {
    this.filters = { page: 1, limit: 10 };
    this.loadEvents();
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages()) return;
    this.filters.page = page;
    this.loadEvents();
  }

  async deleteEvent(event: Event) {
    const result = await Swal.fire({
      title: '¿Eliminar evento?',
      html: `
        <p class="mb-2">Estás a punto de eliminar el evento:</p>
        <p class="fw-bold mb-0">"${event.name}"</p>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    this.eventService.deleteEvent(event.id.toString()).subscribe({
      next: () => {
        Swal.fire({
          title: '¡Eliminado!',
          text: 'El evento ha sido eliminado exitosamente',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
        });
        this.loadEvents();
      },
      error: () => {
        Swal.fire({
          title: 'Error',
          text: 'No se pudo eliminar el evento',
          icon: 'error',
          confirmButtonColor: '#0d6efd',
        });
      },
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