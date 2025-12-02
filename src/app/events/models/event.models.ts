export interface Event {
  id: number;
  name: string;
  description: string;
  date: string;
  location: string;
  max_participants: number;
  status: 'ACTIVE' | 'CANCELLED' | 'FINISHED';
  organizer_id: number;
  organizer?: {
    id: number;
    name: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
  _count?: {
    participants: number;
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
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}