import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { ENV } from '../core/config/env';
import { NotifyService } from '../core/services/notify.service';
import Swal from 'sweetalert2';

type Role = { id: number; name: string; slug: string; description: string | null };
type User = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  profilePhoto: string | null;
  isActive: boolean;
  role: Role;
  createdAt: string | Date;
  updatedAt: string | Date;
};
type UsersResponse = {
  success: boolean;
  message: string;
  data: {
    users: User[];
    pagination: { page: number; limit: number; total: number; pages: number };
  };
};

@Component({
  selector: 'app-users',
  imports: [RouterLink],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="h4">Usuarios</h1>
      <a class="btn btn-primary" [routerLink]="['/users/new']">Nuevo usuario</a>
    </div>

    <div class="d-flex gap-2 align-items-center mb-3">
      <label class="form-label m-0">Estado:</label>
      <select
        #statusSel
        class="form-select w-auto"
        [value]="isActiveFilter()"
        (change)="setFilter(statusSel.value)"
      >
        <option value="">Todos</option>
        <option value="true">Activos</option>
        <option value="false">Inactivos</option>
      </select>

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
            <th>Email</th>
            <th>Rol</th>
            <th>Estado</th>
            <th class="text-end">Acciones</th>
          </tr>
        </thead>
        <tbody>
          @for (user of users(); track user.id) {
          <tr>
            <td>{{ user.firstName }} {{ user.lastName }}</td>
            <td>{{ user.email }}</td>
            <td>{{ user.role.name }}</td>
            <td>
              <span
                class="badge"
                [class.bg-success]="user.isActive"
                [class.bg-secondary]="!user.isActive"
              >
                {{ user.isActive ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td class="text-end">
              <a class="btn btn-sm btn-outline-primary me-2" [routerLink]="['/users', user.id]"
                >Ver</a
              >
              <button
                class="btn btn-sm btn-outline-danger"
                (click)="toggleUserStatus(user.id, user.isActive)"
              >
                {{ user.isActive ? 'Desactivar' : 'Activar' }}
              </button>
            </td>
          </tr>
          } @empty {
          <tr>
            <td colspan="5" class="text-center text-muted">
              Sin usuarios para los criterios seleccionados.
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
export class UsersComponent {
  private readonly http = inject(HttpClient);
  private readonly notify = inject(NotifyService);

  users = signal<User[]>([]);
  page = signal(1);
  limit = signal(10);
  pages = signal(1);
  total = signal(0);
  isActiveFilter = signal<string>(''); // '', 'true', 'false'

  constructor() {
    this.loadUsers();
  }

  setFilter(val: string) {
    this.isActiveFilter.set(val);
    this.page.set(1);
    this.loadUsers();
  }

  setLimit(val: number) {
    this.limit.set(val);
    this.page.set(1);
    this.loadUsers();
  }

  nextPage() {
    if (this.page() < this.pages()) {
      this.page.update((p) => p + 1);
      this.loadUsers();
    }
  }

  prevPage() {
    if (this.page() > 1) {
      this.page.update((p) => p - 1);
      this.loadUsers();
    }
  }

  loadUsers() {
    let params = new HttpParams()
      .set('page', String(this.page()))
      .set('limit', String(this.limit()));
    if (this.isActiveFilter()) {
      params = params.set('isActive', this.isActiveFilter()); // 'true' | 'false'
    }
    this.http.get<UsersResponse>(`${ENV.apiBaseUrl}/users`, { params }).subscribe({
      next: (resp) => {
        const list = resp?.data?.users ?? [];
        const pg = resp?.data?.pagination ?? { page: 1, limit: 10, total: 0, pages: 1 };
        this.users.set(list);
        this.page.set(pg.page);
        this.limit.set(pg.limit);
        this.total.set(pg.total);
        this.pages.set(pg.pages);
      },
      error: (_err: unknown) => {
        this.users.set([]);
        this.page.set(1);
        this.limit.set(10);
        this.total.set(0);
        this.pages.set(1);
        this.notify.error('No se pudieron cargar los usuarios.');
      },
    });
  }

  toggleUserStatus(id: number, isActive: boolean) {
    const action = isActive ? 'desactivar' : 'activar';

    Swal.fire({
      title: `¿Seguro que deseas ${action} este usuario?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, confirmar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      reverseButtons: true,
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.http.delete(`${ENV.apiBaseUrl}/users/${id}`).subscribe({
        next: () => {
          this.notify.success(`Usuario ${isActive ? 'desactivado' : 'activado'} exitosamente.`);
          this.loadUsers();
        },
        error: () => this.notify.error('No se pudo cambiar el estado del usuario.'),
      });
    });
  }
}
