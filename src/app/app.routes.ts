import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./auth/components/login.component').then((m) => m.LoginComponent),
      },
      {
        path: '2fa',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./auth/components/two-factor.component').then((m) => m.TwoFactorComponent),
      },
    ],
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/shell.component').then((m) => m.AdminShellComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          ),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./users/users.component').then((m) => m.UsersComponent),
      },
      {
        path: 'users/new',
        loadComponent: () =>
          import('./users/user-new.component').then((m) => m.UserNewComponent),
      },
      {
        path: 'users/:id',
        loadComponent: () =>
          import('./users/user-detail.component').then(
            (m) => m.UserDetailComponent
          ),
      },
      {
        path: 'events',
        loadComponent: () =>
          import('./events/events.component').then((m) => m.EventsComponent),
      },
      {
        path: 'events/new',
        loadComponent: () =>
          import('./events/event-new.component').then((m) => m.EventNewComponent),
      },
      {
        path: 'events/:id',
        loadComponent: () =>
          import('./events/event-detail.component').then(
            (m) => m.EventDetailComponent
          ),
      },
      {
        path: 'events/:id/edit',
        loadComponent: () =>
          import('./events/event-new.component').then((m) => m.EventNewComponent),
      },
      {
        path: 'approvals',
        loadComponent: () =>
          import('./approvals/approvals.component').then(
            (m) => m.ApprovalsComponent
          ),
      },
      {
        path: 'approvals/:eventId/:participantId',
        loadComponent: () =>
          import('./approvals/approval-detail.component').then(
            (m) => m.ApprovalDetailComponent
          ),
      },
      {
        path: 'analytics',
        loadComponent: () =>
          import('./analytics/analytics.component').then(
            (m) => m.AnalyticsComponent
          ),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '' },
];