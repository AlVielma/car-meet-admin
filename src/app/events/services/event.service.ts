import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ENV } from '../../core/config/env';
import type {
  Event,
  EventFilters,
  EventsResponse,
  CreateEventPayload,
  UpdateEventPayload
} from '../models/event.models';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// 🔥 Nueva interfaz para la respuesta anidada de eventos
interface EventsApiData {
  events: Event[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

@Injectable({ providedIn: 'root' })
export class EventService {
  private http = inject(HttpClient);
  private apiUrl = `${ENV.apiBaseUrl}/events`;

  getEvents(filters?: EventFilters): Observable<EventsResponse> {
    let params = new HttpParams();

    if (filters?.page) params = params.set('page', filters.page.toString());
    if (filters?.limit) params = params.set('limit', filters.limit.toString());
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.search) params = params.set('search', filters.search);
    if (filters?.upcoming !== undefined) params = params.set('upcoming', filters.upcoming.toString());

    return this.http
      .get<ApiResponse<EventsApiData>>(this.apiUrl, { params })
      .pipe(
        map((response) => {
          // 🔥 Acceder a response.data.events en lugar de response.data
          const eventsData = response.data.events;
          const paginationData = response.data.pagination;

          if (!Array.isArray(eventsData)) {
            console.error('response.data.events no es un array:', response);
            throw new Error('Formato de respuesta inválido');
          }

          // Transformar eventos para agregar photoUrl completa
          const events = eventsData.map(event => this.transformEvent(event));

          // Retornar estructura esperada con nombres de campos correctos
          return {
            data: events,
            pagination: {
              page: paginationData.page,
              limit: paginationData.limit,
              totalPages: paginationData.pages, // 🔥 Backend usa "pages" no "totalPages"
              totalItems: paginationData.total  // 🔥 Backend usa "total" no "totalItems"
            }
          };
        })
      );
  }

  getEventById(id: string): Observable<Event> {
    return this.http
      .get<ApiResponse<Event>>(`${this.apiUrl}/${id}`)
      .pipe(map((response) => this.transformEvent(response.data)));
  }

  createEvent(payload: CreateEventPayload): Observable<Event> {
    const formData = this.buildFormData(payload);

    return this.http
      .post<ApiResponse<Event>>(this.apiUrl, formData)
      .pipe(map((response) => this.transformEvent(response.data)));
  }

  updateEvent(id: string, payload: UpdateEventPayload): Observable<Event> {
    const formData = this.buildFormData(payload);

    return this.http
      .put<ApiResponse<Event>>(`${this.apiUrl}/${id}`, formData)
      .pipe(map((response) => this.transformEvent(response.data)));
  }

  deleteEvent(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  cancelEvent(id: string): Observable<Event> {
    return this.http
      .patch<ApiResponse<Event>>(`${this.apiUrl}/${id}/cancel`, {})
      .pipe(map((response) => this.transformEvent(response.data)));
  }

  private buildFormData(payload: CreateEventPayload | UpdateEventPayload): FormData {
    const formData = new FormData();

    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'photo' && value instanceof File) {
          formData.append('image', value);
        } else if (value instanceof Date) {
          formData.append(key, value.toISOString());
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    return formData;
  }

  private transformEvent(event: Event): Event {
    // Construir photoUrl desde el array de photos
    if (event.photos && event.photos.length > 0) {
      // Usar la primera foto del array
      const firstPhoto = event.photos[0];
      event.photoUrl = firstPhoto.url;
    }
    // Fallback al método anterior si existe photoPath
    else if (event.photoPath && !event.photoUrl) {
      const normalizedPath = event.photoPath.replace(/\\/g, '/');

      if (normalizedPath.includes('uploads/')) {
        event.photoUrl = `${ENV.apiBaseUrl.replace('/api', '')}/${normalizedPath}`;
      } else {
        event.photoUrl = `${ENV.apiBaseUrl.replace('/api', '')}/uploads/events/${normalizedPath}`;
      }
    }

    return event;
  }
}