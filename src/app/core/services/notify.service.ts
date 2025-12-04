import { Injectable } from '@angular/core';
import { Notyf } from 'notyf';
import 'notyf/notyf.min.css';

@Injectable({ providedIn: 'root' })
export class NotifyService {
  private notyf = new Notyf({
    duration: 3000,
    ripple: true,
    position: { x: 'center', y: 'top' },
    types: [
      {
        type: 'info',
        background: '#0d6efd',
        icon: { className: 'bi bi-info-circle', tagName: 'i' },
      },
      { type: 'success', background: '#198754' },
      { type: 'error', background: '#dc3545' },
      {
        type: 'warning',
        background: '#ffc107',
        icon: { className: 'bi bi-exclamation-triangle', tagName: 'i' },
      },
    ],
  });

  success(message: string) {
    console.log('SUCCESS:', message);
  }

  error(message: string) {
    console.error('ERROR:', message);
  }

  info(message: string) {
    console.info('INFO:', message);
  }

  warning(message: string) {
    console.warn('WARNING:', message);
  }
}
