import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';
import { SessionService } from '../core/services/session.service';
import { NotifyService } from '../core/services/notify.service';

@Component({
  selector: 'app-admin-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="layout" [class.is-collapsed]="sidebarCollapsed()">
      <aside class="sidebar" aria-label="Menú principal">
        <div class="brand">
          <button
            class="btn btn-sm btn-outline-secondary me-2 d-none d-md-inline-flex btn-icon"
            (click)="toggleSidebar()"
            [attr.aria-pressed]="sidebarCollapsed()"
            aria-label="Alternar menú lateral"
            type="button">
            <i class="bi" [class.bi-layout-sidebar-reverse]="!sidebarCollapsed()" [class.bi-layout-sidebar-inset-reverse]="sidebarCollapsed()"></i>
          </button>

          <span class="brand-logo" aria-hidden="true"><i class="bi bi-car-front text-dark"></i></span>
          <span class="brand-text">CarMeet Admin</span>
        </div>

        <nav class="nav flex-column nav-primary">
          <a class="nav-link"
             routerLink="/dashboard"
             routerLinkActive="active"
             [routerLinkActiveOptions]="{ exact: true }"
             title="Dashboard">
            <i class="bi bi-speedometer2 link-icon" aria-hidden="true"></i>
            <span class="link-text">Dashboard</span>
          </a>

          <a class="nav-link"
             routerLink="/users"
             routerLinkActive="active"
             title="Usuarios">
            <i class="bi bi-people link-icon" aria-hidden="true"></i>
            <span class="link-text">Usuarios</span>
          </a>

          <a class="nav-link"
             routerLink="/events"
             routerLinkActive="active"
             title="Eventos">
            <i class="bi bi-calendar-event link-icon" aria-hidden="true"></i>
            <span class="link-text">Eventos</span>
          </a>

          <a class="nav-link"
             routerLink="/approvals"
             routerLinkActive="active"
             title="Aprobaciones">
            <i class="bi bi-shield-check link-icon" aria-hidden="true"></i>
            <span class="link-text">Aprobaciones</span>
          </a>

          <a class="nav-link"
             routerLink="/analytics"
             routerLinkActive="active"
             title="Analítica">
            <i class="bi bi-graph-up link-icon" aria-hidden="true"></i>
            <span class="link-text">Analítica</span>
          </a>
        </nav>

        <div class="sidebar-footer mt-auto">
          <button class="btn btn-outline-danger w-100" type="button" (click)="logout()">
            <i class="bi bi-box-arrow-right me-1" aria-hidden="true"></i>
            <span class="link-text">Salir</span>
          </button>
        </div>
      </aside>

      <div class="content">
        <nav class="topbar navbar border-bottom">
          <div class="topbar-left">
            <button
              class="btn btn-outline-secondary d-inline-flex d-md-none btn-icon me-2"
              (click)="openMobileSidebar()"
              aria-label="Abrir menú lateral"
              type="button">
              <i class="bi bi-list"></i>
            </button>

            <span class="page-title">Panel de administración</span>
          </div>

          <div class="topbar-right row">
            <button
              class="btn btn-outline-secondary btn-icon col-md-4 me-2"
              type="button"
              (click)="toggleTheme()"
              [attr.aria-pressed]="isDark()"
              [title]="isDark() ? 'Tema claro' : 'Tema oscuro'">
              <i class="bi" [class.bi-sun]="isDark()" [class.bi-moon]="!isDark()"></i>
            </button>

            <div class="user col-md-8" [attr.aria-expanded]="userMenuOpen()" aria-haspopup="menu">
              <button class="btn avatar-btn" type="button" (click)="toggleUserMenu()" [attr.aria-label]="email() || 'anónimo'">
                <div class="avatar">{{ initials() }}</div>
                <i class="bi bi-caret-down-fill caret" aria-hidden="true"></i>
              </button>

              @if (userMenuOpen()) {
                <div class="menu" role="menu">
                  <div class="menu-header">
                    <div class="avatar lg">{{ initials() }}</div>
                    <div class="info">
                      <div class="email">{{ email() || 'anónimo' }}</div>
                      <div class="role text-muted">Administrador</div>
                    </div>
                  </div>
                  <hr class="dropdown-divider" />
                  <button class="dropdown-item" type="button" (click)="logout()">
                    <i class="bi bi-box-arrow-right me-2" aria-hidden="true"></i> Cerrar sesión
                  </button>
                </div>
              }
            </div>
          </div>
        </nav>

        <main class="main">
          <router-outlet />
        </main>
      </div>

      <!-- Overlay para móvil y para cerrar el menú de usuario -->
      <button class="overlay" type="button"
              (click)="closeOverlays()"
              [class.show]="mobileSidebarOpen() || userMenuOpen()"
              aria-label="Cerrar paneles"></button>
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

  // Estado UI
  sidebarCollapsed = signal(false);
  private _mobileSidebarOpen = signal(false);
  userMenuOpen = signal(false);

  // Tema (Bootstrap 5.3)
  theme = signal<'light' | 'dark'>(typeof window !== 'undefined' && localStorage.getItem('theme') === 'dark' ? 'dark' : 'light');
  isDark = computed(() => this.theme() === 'dark');

  // Derivados
  email = () => this.session.email();
  initials = computed(() => {
    const e = this.email();
    if (!e) return 'A';
    const [first] = e.split('@');
    return (first?.[0] ?? 'A').toUpperCase();
  });

  constructor() {
    effect(() => {
      const t = this.theme();
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-bs-theme', t);
        try { localStorage.setItem('theme', t); } catch {}
      }
    });
  }

  // Sidebar desktop
  toggleSidebar() { this.sidebarCollapsed.update(v => !v); }

  // Sidebar móvil (overlay)
  mobileSidebarOpen = () => this._mobileSidebarOpen();
  openMobileSidebar() { this._mobileSidebarOpen.set(true); }
  closeMobileSidebar() { this._mobileSidebarOpen.set(false); }

  // Menú usuario
  toggleUserMenu() { this.userMenuOpen.update(v => !v); }
  closeUserMenu() { this.userMenuOpen.set(false); }

  // Cerrar overlays
  closeOverlays() {
    this.closeUserMenu();
    this.closeMobileSidebar();
  }

  // Tema
  toggleTheme() { this.theme.update(t => (t === 'dark' ? 'light' : 'dark')); }

  // Sesión
  async logout() {
    try {
      await this.auth.logout();
      this.notify.info('Sesión cerrada.');
    } catch {
      this.session.clear();
      await this.router.navigate(['/auth/login']);
    }
  }
}