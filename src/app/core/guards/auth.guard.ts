import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from '../services/session.service';

export const authGuard: CanActivateFn = () => {
  const session = inject(SessionService);
  const router = inject(Router);
  const token = session.getToken();
  if (!token) {
    router.navigate(['/auth/login']);
    return false;
  }
  return true;
};
