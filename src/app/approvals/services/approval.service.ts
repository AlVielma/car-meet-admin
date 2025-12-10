import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ENV } from '../../core/config/env';
import type { Approval, ParticipantDetail, ApprovalFilters } from '../models/approval.models';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class ApprovalService {
  private http = inject(HttpClient);
  private apiUrl = `${ENV.apiBaseUrl}/events`;

  getPendingApprovals(filters?: ApprovalFilters): Observable<ParticipantDetail[]> {
    let params = new HttpParams();
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.eventId) params = params.set('eventId', filters.eventId);

    return this.http
      .get<ApiResponse<Approval[]>>(`${this.apiUrl}/all_participants`, { params })
      .pipe(
        map((response) =>
          response.data.map((approval) => this.transformToParticipantDetail(approval))
        )
      );
  }

  getParticipantDetail(eventId: string, participantId: string): Observable<ParticipantDetail> {
    return this.http
      .get<ApiResponse<Approval>>(`${this.apiUrl}/${eventId}/participants/${participantId}`)
      .pipe(map((response) => this.transformToParticipantDetail(response.data)));
  }

  approveParticipant(eventId: string, participantId: string): Observable<void> {
    return this.http.patch<void>(
      `${this.apiUrl}/${eventId}/participants/${participantId}/status`,
      { status: 'CONFIRMED' }
    );
  }

  rejectParticipant(eventId: string, participantId: string, reason?: string): Observable<void> {
    return this.http.patch<void>(
      `${this.apiUrl}/${eventId}/participants/${participantId}/status`,
      { status: 'CANCELLED', reason }
    );
  }

  private transformToParticipantDetail(data: Approval): ParticipantDetail {
    return {
      id: data.id,
      eventId: data.eventId,
      userId: data.userId,
      carId: data.carId,
      status: data.status,
      joinedAt: data.registeredAt,
      event: {
        id: data.event.id,
        title: data.event.name,
        eventDate: data.event.date,
        location: data.event.location,
      },
      user: {
        id: data.user.id,
        name: `${data.user.firstName} ${data.user.lastName}`,
        email: data.user.email,
        phone: data.user.phone,
      },
      car: {
        id: data.car.id,
        make: data.car.brand,
        model: data.car.model,
        year: data.car.year,
        color: data.car.color,
        licensePlate: data.car.licensePlate,
        modifications: data.car.modifications,
        photoUrl: data.car.photos?.[0]?.url
          ? `${ENV.apiBaseUrl.replace('/api', '')}/${data.car.photos[0].url.replace(/\\/g, '/')}`
          : undefined,
      },
    };
  }
}