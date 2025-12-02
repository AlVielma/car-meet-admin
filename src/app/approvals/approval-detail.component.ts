import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApprovalService } from './services/approval.service';
import { NotifyService } from '../core/services/notify.service';
import type { ParticipantDetail } from './models/approval.models';
import { DatePipe } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-approval-detail',
  imports: [RouterLink, DatePipe],
  template: `
    <div class="container-fluid py-4">
      @if (loading()) {
        <div class="text-center py-5">
          <div class="spinner-border text-primary" role="status"></div>
        </div>
      }

      @if (!loading() && participant()) {
        <div class="mb-4">
          <a class="btn btn-sm btn-outline-secondary mb-3" routerLink="/approvals">
            <i class="bi bi-arrow-left me-1"></i>
            Volver a aprobaciones
          </a>

          <div class="d-flex justify-content-between align-items-start">
            <div>
              <h1 class="h4 mb-2">Revisión de solicitud</h1>
              <span
                class="badge"
                [class.bg-warning]="participant()!.status === 'PENDING'"
                [class.bg-success]="participant()!.status === 'CONFIRMED'"
                [class.bg-danger]="participant()!.status === 'CANCELLED'">
                {{ statusLabel(participant()!.status) }}
              </span>
            </div>
          </div>
        </div>

        <div class="row g-4">
          <!-- Foto del auto -->
          <div class="col-12 col-lg-6">
            <div class="card shadow-sm">
              <div class="card-header">
                <h5 class="card-title mb-0">Fotografía del vehículo</h5>
              </div>
              @if (participant()!.car.photoUrl) {
                <img
                  [src]="participant()!.car.photoUrl"
                  class="card-img-top"
                  [alt]="participant()!.car.make + ' ' + participant()!.car.model"
                  style="max-height: 400px; object-fit: contain; background: #f8f9fa;" />
              } @else {
                <div class="card-body text-center py-5">
                  <i class="bi bi-image display-1 text-muted"></i>
                  <p class="text-muted mt-3">Sin fotografía</p>
                </div>
              }
            </div>
          </div>

          <!-- Info del auto -->
          <div class="col-12 col-lg-6">
            <div class="card shadow-sm mb-3">
              <div class="card-header">
                <h5 class="card-title mb-0">Información del vehículo</h5>
              </div>
              <div class="card-body">
                <div class="row g-3">
                  <div class="col-6">
                    <label class="form-label text-muted small">Marca</label>
                    <p class="mb-0 fw-semibold">{{ participant()!.car.make }}</p>
                  </div>
                  <div class="col-6">
                    <label class="form-label text-muted small">Modelo</label>
                    <p class="mb-0 fw-semibold">{{ participant()!.car.model }}</p>
                  </div>
                  <div class="col-6">
                    <label class="form-label text-muted small">Año</label>
                    <p class="mb-0 fw-semibold">{{ participant()!.car.year }}</p>
                  </div>
                  <div class="col-6">
                    <label class="form-label text-muted small">Color</label>
                    <p class="mb-0 fw-semibold">{{ participant()!.car.color }}</p>
                  </div>
                  <div class="col-12">
                    <label class="form-label text-muted small">Placa</label>
                    <p class="mb-0 fw-semibold">
                      {{ participant()!.car.licensePlate }}
                    </p>
                  </div>

                  @if (participant()!.car.modifications) {
                    <div class="col-12">
                      <label class="form-label text-muted small">
                        Modificaciones
                      </label>
                      <p class="mb-0">{{ participant()!.car.modifications }}</p>
                    </div>
                  }
                </div>
              </div>
            </div>

            <!-- Info del usuario -->
            <div class="card shadow-sm">
              <div class="card-header">
                <h5 class="card-title mb-0">Información del usuario</h5>
              </div>
              <div class="card-body">
                <p class="mb-2">
                  <i class="bi bi-person me-2 text-muted"></i>
                  <strong>{{ participant()!.user.name }}</strong>
                </p>
                <p class="mb-2">
                  <i class="bi bi-envelope me-2 text-muted"></i>
                  {{ participant()!.user.email }}
                </p>
                @if (participant()!.user.phone) {
                  <p class="mb-0">
                    <i class="bi bi-phone me-2 text-muted"></i>
                    {{ participant()!.user.phone }}
                  </p>
                }
              </div>
            </div>
          </div>

          <!-- Info del evento -->
          <div class="col-12">
            <div class="card shadow-sm">
              <div class="card-header">
                <h5 class="card-title mb-0">Evento</h5>
              </div>
              <div class="card-body">
                <h6 class="mb-2">{{ participant()!.event.title }}</h6>
                <p class="mb-1">
                  <i class="bi bi-calendar3 me-2 text-muted"></i>
                  {{ participant()!.event.eventDate | date: 'dd/MM/yyyy HH:mm' }}
                </p>
                <p class="mb-2">
                  <i class="bi bi-geo-alt me-2 text-muted"></i>
                  {{ participant()!.event.location }}
                </p>
                <p class="text-muted small mb-0">
                  Solicitud enviada el:
                  {{ participant()!.joinedAt | date: 'dd/MM/yyyy HH:mm' }}
                </p>
              </div>
            </div>
          </div>

          <!-- Acciones (solo si está pendiente) -->
          @if (participant()!.status === 'PENDING') {
            <div class="col-12">
              <div class="card shadow-sm">
                <div class="card-header">
                  <h5 class="card-title mb-0">Tomar decisión</h5>
                </div>
                <div class="card-body">
                  <div class="d-flex gap-3">
                    <button
                      class="btn btn-success"
                      type="button"
                      (click)="approve()"
                      [disabled]="submitting()">
                      @if (submitting()) {
                        <span class="spinner-border spinner-border-sm me-1"></span>
                      }
                      <i class="bi bi-check-lg me-1"></i>
                      Aprobar solicitud
                    </button>

                    <button
                      class="btn btn-outline-danger"
                      type="button"
                      (click)="reject()"
                      [disabled]="submitting()">
                      <i class="bi bi-x-lg me-1"></i>
                      Rechazar solicitud
                    </button>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'd-block' },
})
export class ApprovalDetailComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private approvalService = inject(ApprovalService);
  private notify = inject(NotifyService);

  participant = signal<ParticipantDetail | null>(null);
  loading = signal(true);
  submitting = signal(false);

  constructor() {
    const eventId = this.route.snapshot.paramMap.get('eventId');
    const participantId = this.route.snapshot.paramMap.get('participantId');

    if (eventId && participantId) {
      this.loadParticipant(eventId, participantId);
    }
  }

  loadParticipant(eventId: string, participantId: string) {
    this.approvalService.getParticipantDetail(eventId, participantId).subscribe({
      next: (participant) => {
        this.participant.set(participant);
        this.loading.set(false);
      },
      error: () => {
        this.notify.error('Error al cargar solicitud');
        this.loading.set(false);
      },
    });
  }

  async approve() {
    const result = await Swal.fire({
      title: '¿Aprobar esta solicitud?',
      text: 'El participante será confirmado para el evento',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#198754',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, aprobar',
      cancelButtonText: 'Cancelar',
    });

    if (!result.isConfirmed) return;

    const eventId = this.route.snapshot.paramMap.get('eventId')!;
    const participantId = this.route.snapshot.paramMap.get('participantId')!;

    this.submitting.set(true);
    this.approvalService.approveParticipant(eventId, participantId).subscribe({
      next: () => {
        this.notify.success('Solicitud aprobada correctamente');
        this.router.navigate(['/approvals']);
      },
      error: () => {
        this.notify.error('Error al aprobar solicitud');
        this.submitting.set(false);
      },
    });
  }

  async reject() {
    const result = await Swal.fire({
      title: '¿Rechazar esta solicitud?',
      html: `
        <textarea
          id="swal-reason"
          class="form-control"
          rows="3"
          placeholder="Motivo del rechazo (opcional)"></textarea>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, rechazar',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const textarea = document.getElementById('swal-reason') as HTMLTextAreaElement;
        return textarea.value;
      },
    });

    if (!result.isConfirmed) return;

    const eventId = this.route.snapshot.paramMap.get('eventId')!;
    const participantId = this.route.snapshot.paramMap.get('participantId')!;
    const reason = result.value || undefined;

    this.submitting.set(true);
    this.approvalService.rejectParticipant(eventId, participantId, reason).subscribe({
      next: () => {
        this.notify.success('Solicitud rechazada');
        this.router.navigate(['/approvals']);
      },
      error: () => {
        this.notify.error('Error al rechazar solicitud');
        this.submitting.set(false);
      },
    });
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      PENDING: 'Pendiente',
      CONFIRMED: 'Confirmado',
      CANCELLED: 'Rechazado',
    };
    return labels[status] || status;
  }
}