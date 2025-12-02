import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  computed,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EventService } from './services/event.service';
import { NotifyService } from '../core/services/notify.service';
import type { Event, EventParticipant } from './models/event.models';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-event-detail',
  imports: [RouterLink, DatePipe, FormsModule],
  template: `
    <div class="container-fluid py-4">
      @if (loading()) {
        <div class="text-center py-5">
          <div class="spinner-border text-primary" role="status"></div>
        </div>
      }

      @if (!loading() && event()) {
        <div class="mb-4">
          <a class="btn btn-sm btn-outline-secondary mb-3" routerLink="/events">
            <i class="bi bi-arrow-left me-1"></i>
            Volver
          </a>

          <div class="d-flex justify-content-between align-items-start">
            <div>
              <h1 class="h4 mb-2">{{ event()!.name }}</h1>
              <span
                class="badge"
                [class.bg-success]="event()!.status === 'ACTIVE'"
                [class.bg-primary]="event()!.status === 'FINISHED'"
                [class.bg-danger]="event()!.status === 'CANCELLED'">
                {{ statusLabel(event()!.status) }}
              </span>
            </div>
            <a
              class="btn btn-primary"
              [routerLink]="['/events', event()!.id, 'edit']">
              <i class="bi bi-pencil me-1"></i>
              Editar
            </a>
          </div>
        </div>

        <div class="row g-4">
          <!-- Info del evento -->
          <div class="col-12 col-lg-4">
            <div class="card shadow-sm">
              <div class="card-header ">
                <h5 class="card-title mb-0">Información</h5>
              </div>
              <div class="card-body">
                <p class="mb-2">
                  <i class="bi bi-calendar3 me-2 text-muted"></i>
                  {{ event()!.date | date: 'dd/MM/yyyy HH:mm' }}
                </p>
                <p class="mb-2">
                  <i class="bi bi-geo-alt me-2 text-muted"></i>
                  {{ event()!.location }}
                </p>
                <p class="mb-2">
                  <i class="bi bi-people me-2 text-muted"></i>
                  {{ event()!._count?.participants || 0 }} /
                  {{ event()!.max_participants }} participantes
                </p>
                <hr />
                <p class="text-muted small mb-0">
                  <strong>Organizador:</strong><br />
                  {{ event()!.organizer?.name ?? '' }}<br />
                  {{ event()!.organizer?.email ?? '' }}
                </p>
              </div>
            </div>
          </div>

          <!-- Descripción + participantes -->
          <div class="col-12 col-lg-8">
            <div class="card shadow-sm mb-4">
              <div class="card-header ">
                <h5 class="card-title mb-0">Descripción</h5>
              </div>
              <div class="card-body">
                <p class="mb-0">{{ event()!.description }}</p>
              </div>
            </div>

            <div class="card shadow-sm">
              <div class="card-header ">
                <div class="d-flex justify-content-between align-items-center">
                  <h5 class="card-title mb-0">Participantes</h5>
                  <select
                    class="form-select form-select-sm w-auto"
                    [(ngModel)]="participantFilter"
                    (change)="loadParticipants()">
                    <option value="">Todos</option>
                    <option value="PENDING">Pendientes</option>
                    <option value="CONFIRMED">Confirmados</option>
                    <option value="CANCELLED">Cancelados</option>
                  </select>
                </div>
              </div>
              <div class="card-body">
                @if (loadingParticipants()) {
                  <div class="text-center py-3">
                    <div
                      class="spinner-border spinner-border-sm text-primary"
                      role="status"></div>
                  </div>
                }

                @if (!loadingParticipants() && participants().length > 0) {
                  <div class="table-responsive">
                    <table class="table table-hover">
                      <thead>
                        <tr>
                          <th>Usuario</th>
                          <th>Auto</th>
                          <th>Estado</th>
                          <th>Fecha</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (p of participants(); track p.id) {
                          <tr>
                            <td>
                              <div>{{ p.user.name }}</div>
                              <small class="text-muted">{{
                                p.user.email
                              }}</small>
                            </td>
                            <td>
                              {{ p.car.make }} {{ p.car.model }}
                              {{ p.car.year }}
                            </td>
                            <td>
                              <span
                                class="badge"
                                [class.bg-warning]="p.status === 'PENDING'"
                                [class.bg-success]="p.status === 'CONFIRMED'"
                                [class.bg-danger]="p.status === 'CANCELLED'">
                                {{ participantStatusLabel(p.status) }}
                              </span>
                            </td>
                            <td>{{ p.registeredAt | date: 'dd/MM/yyyy' }}</td>
                            <td>
                              <a
                                class="btn btn-sm btn-outline-primary"
                                [routerLink]="[
                                  '/approvals',
                                  event()!.id,
                                  p.id
                                ]">
                                Ver
                              </a>
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                }

                @if (!loadingParticipants() && participants().length === 0) {
                  <p class="text-muted text-center mb-0">
                    No hay participantes
                  </p>
                }
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'd-block' },
})
export class EventDetailComponent {
  private route = inject(ActivatedRoute);
  private eventService = inject(EventService);
  private notify = inject(NotifyService);

  event = signal<Event | null>(null);
  participants = signal<EventParticipant[]>([]);
  loading = signal(true);
  loadingParticipants = signal(true);
  participantFilter: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | '' = '';

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadEvent(id);
      this.loadParticipants();
    }
  }

  loadEvent(id: string) {
    this.eventService.getEventById(id).subscribe({
      next: (event) => {
        this.event.set(event);
        this.loading.set(false);
      },
      error: () => {
        this.notify.error('Error al cargar evento');
        this.loading.set(false);
      },
    });
  }

  loadParticipants() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.loadingParticipants.set(true);
    const status = this.participantFilter || undefined;
    this.eventService.getParticipants(id, status as any).subscribe({
      next: (participants) => {
        this.participants.set(participants);
        this.loadingParticipants.set(false);
      },
      error: () => {
        this.notify.error('Error al cargar participantes');
        this.loadingParticipants.set(false);
      },
    });
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      DRAFT: 'Borrador',
      ACTIVE: 'Activo',
      COMPLETED: 'Completado',
      CANCELLED: 'Cancelado',
    };
    return labels[status] || status;
  }

  participantStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      PENDING: 'Pendiente',
      CONFIRMED: 'Confirmado',
      CANCELLED: 'Cancelado',
    };
    return labels[status] || status;
  }
}