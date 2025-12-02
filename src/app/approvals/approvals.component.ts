import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApprovalService } from './services/approval.service';
import { NotifyService } from '../core/services/notify.service';
import type { ParticipantDetail } from './models/approval.models';
import { DatePipe } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-approvals',
  imports: [RouterLink, DatePipe],
  template: `
    <div class="container-fluid py-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 class="h4 mb-0">Aprobaciones Pendientes</h1>
          <p class="text-muted small mb-0">
            Revisa y aprueba las solicitudes de participación
          </p>
        </div>
        @if (pendingCount() > 0) {
          <span class="badge bg-warning text-dark fs-6">
            {{ pendingCount() }} pendientes
          </span>
        }
      </div>

      @if (loading()) {
        <div class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Cargando...</span>
          </div>
        </div>
      }

      @if (!loading() && approvals().length > 0) {
        <div class="row g-3">
          @for (approval of approvals(); track approval.id) {
            <div class="col-12 col-lg-6 col-xl-4">
              <div class="card shadow-sm h-100">
                @if (approval.car.photoUrl) {
                  <img
                    [src]="approval.car.photoUrl"
                    class="card-img-top"
                    [alt]="approval.car.make + ' ' + approval.car.model"
                    style="height: 200px; object-fit: cover;" />
                }
                <div class="card-body">
                  <div class="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h5 class="card-title mb-1">
                        {{ approval.car.make }} {{ approval.car.model }}
                      </h5>
                      <p class="text-muted small mb-0">
                        {{ approval.car.year }} • {{ approval.car.color }}
                      </p>
                    </div>
                    <span class="badge bg-warning text-dark">Pendiente</span>
                  </div>

                  <div class="mb-3">
                    <p class="mb-1">
                      <i class="bi bi-person me-2 text-muted"></i>
                      <strong>{{ approval.user.name }}</strong>
                    </p>
                    <p class="mb-1 small text-muted">
                      <i class="bi bi-envelope me-2"></i>
                      {{ approval.user.email }}
                    </p>
                  </div>

                  <div class="mb-3">
                    <p class="mb-1">
                      <i class="bi bi-calendar-event me-2 text-muted"></i>
                      <strong>{{ approval.event.title }}</strong>
                    </p>
                    <p class="mb-1 small text-muted">
                      <i class="bi bi-geo-alt me-2"></i>
                      {{ approval.event.location }}
                    </p>
                    <p class="mb-0 small text-muted">
                      <i class="bi bi-clock me-2"></i>
                      {{ approval.event.eventDate | date: 'dd/MM/yyyy HH:mm' }}
                    </p>
                  </div>

                  <hr />

                  <div class="d-flex gap-2">
                    <a
                      class="btn btn-sm btn-outline-primary flex-fill"
                      [routerLink]="['/approvals', approval.eventId, approval.id]">
                      <i class="bi bi-eye me-1"></i>
                      Ver detalle
                    </a>
                    <button
                      class="btn btn-sm btn-success"
                      type="button"
                      (click)="quickApprove(approval.eventId.toString(), approval.id.toString())"
                      title="Aprobar rápido">
                      <i class="bi bi-check-lg"></i>
                    </button>
                    <button
                      class="btn btn-sm btn-danger"
                      type="button"
                      (click)="quickReject(approval.eventId.toString(), approval.id.toString())"
                      title="Rechazar rápido">
                      <i class="bi bi-x-lg"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      }

      @if (!loading() && approvals().length === 0) {
        <div class="text-center py-5">
          <i class="bi bi-check-circle display-1 text-success"></i>
          <p class="text-muted mt-3">No hay solicitudes pendientes</p>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'd-block' },
})
export class ApprovalsComponent {
  private approvalService = inject(ApprovalService);
  private notify = inject(NotifyService);

  approvals = signal<ParticipantDetail[]>([]);
  loading = signal(true);

  pendingCount = computed(() => this.approvals().length);

  constructor() {
    this.loadApprovals();
  }

  loadApprovals() {
    this.loading.set(true);
    this.approvalService.getPendingApprovals({ status: 'PENDING' }).subscribe({
      next: (approvals) => {
        this.approvals.set(approvals);
        this.loading.set(false);
      },
      error: () => {
        this.notify.error('Error al cargar aprobaciones');
        this.loading.set(false);
      },
    });
  }

  async quickApprove(eventId: string, participantId: string) {
    const result = await Swal.fire({
      title: '¿Aprobar esta solicitud?',
      text: 'El participante será notificado de la aprobación',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#198754',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, aprobar',
      cancelButtonText: 'Cancelar',
    });

    if (!result.isConfirmed) return;

    this.approvalService.approveParticipant(eventId, participantId).subscribe({
      next: () => {
        this.notify.success('Solicitud aprobada');
        this.loadApprovals();
      },
      error: () => this.notify.error('Error al aprobar'),
    });
  }

  async quickReject(eventId: string, participantId: string) {
    const result = await Swal.fire({
      title: '¿Rechazar esta solicitud?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, rechazar',
      cancelButtonText: 'Cancelar',
    });

    if (!result.isConfirmed) return;

    this.approvalService.rejectParticipant(eventId, participantId).subscribe({
      next: () => {
        this.notify.success('Solicitud rechazada');
        this.loadApprovals();
      },
      error: () => this.notify.error('Error al rechazar'),
    });
  }
}