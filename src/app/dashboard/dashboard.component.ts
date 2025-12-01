import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  template: `
    <div class="row g-4">
      <div class="col-12">
        <h1 class="h4 mb-3">Panel administrativo</h1>
        <p class="text-muted">Accede a las secciones para administrar el sistema.</p>
      </div>

      <div class="col-12 col-md-6">
        <div class="card shadow-sm">
          <div class="card-body">
            <h2 class="h6 mb-2">Usuarios</h2>
            <p class="mb-3">Gestión de cuentas, roles y estado.</p>
            <a class="btn btn-outline-primary" [routerLink]="['/users']">Ir a usuarios</a>
          </div>
        </div>
      </div>

      <div class="col-12 col-md-6">
        <div class="card shadow-sm">
          <div class="card-body">
            <h2 class="h6 mb-2">Eventos</h2>
            <p class="mb-3">Crear, editar y administrar eventos de carros.</p>
            <a class="btn btn-outline-primary" [routerLink]="['/events']">Ir a eventos</a>
          </div>
        </div>
      </div>

      <div class="col-12 col-md-6">
        <div class="card shadow-sm">
          <div class="card-body">
            <h2 class="h6 mb-2">Aprobaciones</h2>
            <p class="mb-3">Aceptar o declinar carros para eventos.</p>
            <a class="btn btn-outline-primary" [routerLink]="['/approvals']">Ir a aprobaciones</a>
          </div>
        </div>
      </div>

      <div class="col-12 col-md-6">
        <div class="card shadow-sm">
          <div class="card-body">
            <h2 class="h6 mb-2">Analítica</h2>
            <p class="mb-3">Gráficas de asistencia, carros y personas.</p>
            <a class="btn btn-outline-primary" [routerLink]="['/analytics']">Ir a analítica</a>
          </div>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'd-block py-4' },
})
export class DashboardComponent {}
