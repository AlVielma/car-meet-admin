import { Component, signal, ChangeDetectionStrategy, TemplateRef, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

// Componente raíz. Se agrega:
// - changeDetection: OnPush (mejor rendimiento)
// - host: clase para layout
// - inyección de NgbModal con inject()
// - signal openedCount para contar aperturas (ejemplo de estado)
@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'd-block' },
  imports: [RouterOutlet],
})
export class App {
  private readonly modal = inject(NgbModal);

  protected readonly title = signal('car-meet-admin');
  protected readonly openedCount = signal(0);

  // Recibe el TemplateRef desde el template (click)="openInfo(infoTpl)"
  openInfo(template: TemplateRef<unknown>) {
    this.openedCount.update((v) => v + 1);
    this.modal.open(template, { centered: true });
  }
}
