export interface Event {
  id: number;
  organizerId: number;
  name: string;
  description: string;
  location: string;
  date: string;
  startTime: string;
  endTime?: string;
  status: 'DRAFT' | 'ACTIVE' | 'FINISHED' | 'CANCELLED';
  max_participants: number;
  photoPath?: string;
  photoUrl?: string;
  photos?: Array<{
    id: number;
    url: string;
    caption?: string;
  }>;
  createdAt: string;
  updatedAt: string;
  _count?: {
    participants: number;
  };
  organizer?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface EventParticipant {
  id: string;
  userId: string;
  eventId: string;
  carId: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  registeredAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  car: {
    id: string;
    make: string;
    model: string;
    year: number;
    color: string;
    licensePlate: string;
    photoUrl?: string;
    modifications?: string;
  };
}

export interface CreateEventDto {
  name: string;
  description: string;
  date: string;
  location: string;
}

export interface UpdateEventDto extends Partial<CreateEventDto> {
  status?: 'ACTIVE' | 'CANCELLED' | 'FINISHED';
}

export interface EventFilters {
  page?: number;
  limit?: number;
  status?: string;
  organizerId?: number;
  upcoming?: boolean;
  search?: string;
}

export interface EventsResponse {
  data: Event[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
  };
}

export interface CreateEventPayload {
  name: string;
  description: string;
  location: string;
  date: string;
  startTime: string;
  endTime?: string;
  photo?: File;
}

export interface UpdateEventPayload extends Partial<CreateEventPayload> {
  status?: 'DRAFT' | 'ACTIVE' | 'FINISHED' | 'CANCELLED';
}