import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';
import { SessionService } from '../core/services/session.service';
import { NotifyService } from '../core/services/notify.service';

@Component({
  selector: 'app-admin-shell',
  imports: [RouterOutlet, RouterLink],
  template: `
    <div class="d-flex">
      <aside class="bg-light border-end" style="width: 250px; min-height: 100vh;">
        <div class="p-3 border-bottom">
          <h1 class="h6 m-0">CarMeet Admin</h1>
        </div>
        <nav class="nav flex-column p-2">
          <a class="nav-link" [routerLink]="['/dashboard']">Dashboard</a>
          <a class="nav-link" [routerLink]="['/users']">Usuarios</a>
          <a class="nav-link" [routerLink]="['/events']">Eventos</a>
          <a class="nav-link" [routerLink]="['/approvals']">Aprobaciones</a>
          <a class="nav-link" [routerLink]="['/analytics']">Analítica</a>
          <button class="btn btn-sm btn-outline-secondary mt-3" (click)="logout()">Salir</button>
        </nav>
      </aside>

      <div class="flex-grow-1">
        <nav class="navbar navbar-expand bg-white border-bottom px-3">
          <span class="navbar-text small text-muted">Sesión: {{ email() || 'anónimo' }}</span>
        </nav>
        <main class="p-4">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'd-block' },
})
export class AdminShellComponent {
  private auth = inject(AuthService);
  private session = inject(SessionService);
  private router = inject(Router);
  private notify = inject(NotifyService);

  email = () => this.session.email();

  logout() {
    this.auth.logout().subscribe({
      next: async () => {
        this.session.clear();
        this.notify.info('Sesión cerrada.');
        await this.router.navigate(['/auth/login']);
      },
      error: async () => {
        // Aun si falla en servidor, limpia local y redirige
        this.session.clear();
        await this.router.navigate(['/auth/login']);
      },
    });
  }
}
