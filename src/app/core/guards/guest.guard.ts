import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { SessionService } from '../services/session.service';

// Permite pasar solo si no hay sesión; si hay sesión, redirige al dashboard
export const guestGuard: CanActivateFn = () => {
  const session = inject(SessionService);
  const router = inject(Router);

  if (!session.isAuthenticated()) return true;
  router.navigate(['/dashboard']); // o '/'
  return false;
};
