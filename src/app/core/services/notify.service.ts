import { Injectable } from '@angular/core';
import { Notyf } from 'notyf';
import 'notyf/notyf.min.css';

@Injectable({ providedIn: 'root' })
export class NotifyService {
  private notyf = new Notyf({
    duration: 3000,
    ripple: true,
    position: { x: 'right', y: 'top' },
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
    this.notyf.success(message);
  }
  error(message: string) {
    this.notyf.error(message);
  }
  info(message: string) {
    this.notyf.open({ type: 'info', message });
  }
  warning(message: string) {
    this.notyf.open({ type: 'warning', message });
  }
}
