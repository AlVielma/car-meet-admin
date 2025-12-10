import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { SessionService } from '../services/session.service';
import { NotifyService } from '../services/notify.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(SessionService);
  const router = inject(Router);
  const notify = inject(NotifyService);
  
  const token = session.getToken();
  
  // Solo agregar token si existe y no es una ruta pública
  const isPublicRoute = req.url.includes('/auth/login') || 
                        req.url.includes('/auth/admin-login') ||
                        req.url.includes('/auth/verify-code') ||
                        req.url.includes('/auth/resend-code') ||
                        req.url.includes('/auth/register') ||
                        req.url.includes('/auth/activate');

  let authReq = req;
  
  if (token && !isPublicRoute) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error) => {
      // Manejar errores de autenticación
      if (error.status === 401 || error.status === 403) {
        // Token inválido o expirado
        session.clear();
        notify.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        router.navigate(['/auth/login']);
      }
      
      return throwError(() => error);
    })
  );
};
