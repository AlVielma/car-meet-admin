import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ENV } from '../../core/config/env';
import type {
  Event,
  EventParticipant,
  CreateEventDto,
  UpdateEventDto,
  EventFilters,
} from '../models/event.models';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface PaginatedData<T> {
  events: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable({ providedIn: 'root' })
export class EventService {
  private http = inject(HttpClient);
  private apiUrl = `${ENV.apiBaseUrl}/events`;

  getEvents(filters?: EventFilters): Observable<PaginatedResponse<Event>> {
    let params = new HttpParams();
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.search) params = params.set('search', filters.search);
    if (filters?.startDate) params = params.set('startDate', filters.startDate);
    if (filters?.endDate) params = params.set('endDate', filters.endDate);
    if (filters?.page) params = params.set('page', filters.page.toString());
    if (filters?.limit) params = params.set('limit', filters.limit.toString());

    return this.http
      .get<ApiResponse<PaginatedData<Event>>>(this.apiUrl, { params })
      .pipe(
        map((response) => ({
          data: response.data.events,
          pagination: {
            page: response.data.pagination.page,
            limit: response.data.pagination.limit,
            total: response.data.pagination.total,
            totalPages: response.data.pagination.pages,
          },
        }))
      );
  }

  getEventById(id: string): Observable<Event> {
    return this.http
      .get<ApiResponse<Event>>(`${this.apiUrl}/${id}`)
      .pipe(map((response) => response.data));
  }

  createEvent(data: CreateEventDto): Observable<Event> {
    return this.http
      .post<ApiResponse<Event>>(this.apiUrl, data)
      .pipe(map((response) => response.data));
  }

  updateEvent(id: string, data: UpdateEventDto): Observable<Event> {
    return this.http
      .put<ApiResponse<Event>>(`${this.apiUrl}/${id}`, data)
      .pipe(map((response) => response.data));
  }

  deleteEvent(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  cancelEvent(id: string): Observable<Event> {
    return this.http
      .patch<ApiResponse<Event>>(`${this.apiUrl}/${id}/cancel`, {})
      .pipe(map((response) => response.data));
  }

  getParticipants(
    eventId: string,
    status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED'
  ): Observable<EventParticipant[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http
      .get<ApiResponse<EventParticipant[]>>(
        `${this.apiUrl}/${eventId}/participants`,
        { params }
      )
      .pipe(map((response) => response.data));
  }

  getParticipantDetail(
    eventId: string,
    participantId: string
  ): Observable<EventParticipant> {
    return this.http
      .get<ApiResponse<EventParticipant>>(
        `${this.apiUrl}/${eventId}/participants/${participantId}`
      )
      .pipe(map((response) => response.data));
  }

  updateParticipantStatus(
    eventId: string,
    participantId: string,
    status: 'CONFIRMED' | 'CANCELLED'
  ): Observable<EventParticipant> {
    return this.http
      .patch<ApiResponse<EventParticipant>>(
        `${this.apiUrl}/${eventId}/participants/${participantId}/status`,
        { status }
      )
      .pipe(map((response) => response.data));
  }
}