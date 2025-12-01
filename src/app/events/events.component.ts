import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { ENV } from '../core/config/env';
import { NotifyService } from '../core/services/notify.service';

type EventOrganizer = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  photos: { id: number; url: string; isMain: boolean }[];
};
type EventItem = {
  id: number;
  name: string;
  description: string | null;
  location: string;
  date: string; // ISO
  startTime: string; // ISO
  endTime: string | null; // ISO
  status: 'ACTIVE' | 'CANCELLED' | 'FINISHED' | string;
  createdAt: string;
  updatedAt: string;
  organizer: EventOrganizer;
  photos: { id: number; url: string; caption: string | null; isMain: boolean }[];
  _count?: { participants: number };
};
type EventsResponse = {
  success: boolean;
  message: string;
  data: {
    events: EventItem[];
    pagination: { page: number; limit: number; total: number; pages: number };
  };
};

@Component({
  selector: 'app-events',
  imports: [RouterLink],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="h4">Eventos</h1>
      <a class="btn btn-primary" [routerLink]="['/events/new']">Nuevo evento</a>
    </div>

    <div class="d-flex flex-wrap gap-2 align-items-center mb-3">
      <label class="form-label m-0">Estado:</label>
      <select
        #statusSel
        class="form-select w-auto"
        [value]="statusFilter()"
        (change)="setStatus(statusSel.value)"
      >
        <option value="">Todos</option>
        <option value="ACTIVE">Activos</option>
        <option value="CANCELLED">Cancelados</option>
        <option value="FINISHED">Finalizados</option>
      </select>

      <div class="form-check ms-2">
        <input
          id="upcoming"
          class="form-check-input"
          type="checkbox"
          #upcomingChk
          [checked]="upcoming()"
          (change)="toggleUpcoming(upcomingChk.checked)"
        />
        <label class="form-check-label" for="upcoming">Solo próximos</label>
      </div>

      <label class="form-label m-0 ms-3">Límite:</label>
      <select
        #limitSel
        class="form-select w-auto"
        [value]="limit()"
        (change)="setLimit(+limitSel.value)"
      >
        <option [value]="10">10</option>
        <option [value]="20">20</option>
        <option [value]="50">50</option>
      </select>
    </div>

    <div class="table-responsive">
      <table class="table table-hover align-middle">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Fecha</th>
            <th>Horario</th>
            <th>Ubicación</th>
            <th>Estado</th>
            <th>Asistentes</th>
            <th class="text-end">Acciones</th>
          </tr>
        </thead>
        <tbody>
          @for (ev of events(); track ev.id) {
          <tr>
            <td>{{ ev.name }}</td>
            <td>{{ formatDate(ev.date) }}</td>
            <td>
              {{ formatTime(ev.startTime) }}{{ ev.endTime ? ' - ' + formatTime(ev.endTime) : '' }}
            </td>
            <td>{{ ev.location }}</td>
            <td>
              <span
                class="badge"
                [class.bg-success]="ev.status === 'ACTIVE'"
                [class.bg-secondary]="ev.status === 'FINISHED'"
                [class.bg-danger]="ev.status === 'CANCELLED'"
              >
                {{ ev.status }}
              </span>
            </td>
            <td>{{ ev._count?.participants ?? 0 }}</td>
            <td class="text-end">
              <a class="btn btn-sm btn-outline-primary me-2" [routerLink]="['/events', ev.id]"
                >Ver</a
              >
              <button
                class="btn btn-sm btn-outline-warning me-2"
                (click)="confirmCancel(ev.id)"
                [disabled]="ev.status !== 'ACTIVE'"
              >
                Cancelar
              </button>
              <button class="btn btn-sm btn-outline-danger" (click)="confirmDelete(ev.id)">
                Eliminar
              </button>
            </td>
          </tr>
          } @empty {
          <tr>
            <td colspan="7" class="text-center text-muted">
              Sin eventos para los criterios seleccionados.
            </td>
          </tr>
          }
        </tbody>
      </table>
    </div>

    <div class="d-flex justify-content-between align-items-center mt-3">
      <div class="text-muted">Página {{ page() }} de {{ pages() }} • Total {{ total() }}</div>
      <div class="btn-group">
        <button class="btn btn-outline-secondary" (click)="prevPage()" [disabled]="page() <= 1">
          Anterior
        </button>
        <button
          class="btn btn-outline-secondary"
          (click)="nextPage()"
          [disabled]="page() >= pages()"
        >
          Siguiente
        </button>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'd-block py-4' },
})
export class EventsComponent {
  private http = inject(HttpClient);
  private notify = inject(NotifyService);

  events = signal<EventItem[]>([]);
  page = signal(1);
  limit = signal(10);
  pages = signal(1);
  total = signal(0);
  statusFilter = signal<string>(''); // '', 'ACTIVE', 'CANCELLED', 'FINISHED'
  upcoming = signal<boolean>(false);

  constructor() {
    this.loadEvents();
  }

  formatDate(iso: string) {
    return new Date(iso).toLocaleDateString();
  }
  formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  setStatus(val: string) {
    this.statusFilter.set(val);
    this.page.set(1);
    this.loadEvents();
  }
  setLimit(val: number) {
    this.limit.set(val);
    this.page.set(1);
    this.loadEvents();
  }
  toggleUpcoming(val: boolean) {
    this.upcoming.set(val);
    this.page.set(1);
    this.loadEvents();
  }

  nextPage() {
    if (this.page() < this.pages()) {
      this.page.update((p) => p + 1);
      this.loadEvents();
    }
  }
  prevPage() {
    if (this.page() > 1) {
      this.page.update((p) => p - 1);
      this.loadEvents();
    }
  }

  loadEvents() {
    let params = new HttpParams()
      .set('page', String(this.page()))
      .set('limit', String(this.limit()));
    if (this.statusFilter()) params = params.set('status', this.statusFilter());
    if (this.upcoming()) params = params.set('upcoming', 'true');

    this.http.get<EventsResponse>(`${ENV.apiBaseUrl}/events`, { params }).subscribe({
      next: (resp) => {
        const list = resp?.data?.events ?? [];
        const pg = resp?.data?.pagination ?? { page: 1, limit: 10, total: 0, pages: 1 };
        this.events.set(list);
        this.page.set(pg.page);
        this.limit.set(pg.limit);
        this.total.set(pg.total);
        this.pages.set(pg.pages);
      },
      error: () => {
        this.events.set([]);
        this.page.set(1);
        this.limit.set(10);
        this.total.set(0);
        this.pages.set(1);
        this.notify.error('No se pudieron cargar los eventos.');
      },
    });
  }

  confirmCancel(id: number) {
    Swal.fire({
      title: '¿Cancelar evento?',
      text: 'Esta acción marcará el evento como CANCELLED.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'Volver',
      confirmButtonColor: '#fd7e14',
      cancelButtonColor: '#6c757d',
      reverseButtons: true,
    }).then((result) => {
      if (!result.isConfirmed) return;
      this.http.patch(`${ENV.apiBaseUrl}/events/${id}/cancel`, {}).subscribe({
        next: () => {
          this.notify.success('Evento cancelado.');
          this.loadEvents();
        },
        error: () => this.notify.error('No se pudo cancelar el evento.'),
      });
    });
  }

  confirmDelete(id: number) {
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
      this.http.delete(`${ENV.apiBaseUrl}/events/${id}`).subscribe({
        next: () => {
          this.notify.success('Evento eliminado.');
          this.loadEvents();
        },
        error: () => this.notify.error('No se pudo eliminar el evento.'),
      });
    });
  }
}
