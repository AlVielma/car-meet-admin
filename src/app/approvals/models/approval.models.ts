export interface Approval {
  id: number;
  eventId: number;
  userId: number;
  carId: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  registeredAt: string;
  event: {
    id: number;
    name: string;
    date: string;
    location: string;
  };
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  car: {
    id: number;
    brand: string;
    model: string;
    year: number;
    color: string;
    licensePlate: string;
    modifications?: string;
    photos?: Array<{ url: string }>;
  };
}

export interface ParticipantDetail {
  id: number;
  eventId: number;
  userId: number;
  carId: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  joinedAt: string;
  event: {
    id: number;
    title: string;
    eventDate: string;
    location: string;
  };
  user: {
    id: number;
    name: string;
    email: string;
    phone?: string;
  };
  car: {
    id: number;
    make: string;
    model: string;
    year: number;
    color: string;
    licensePlate: string;
    modifications?: string;
    photoUrl?: string;
    engineType?: string;
    transmission?: string;
  };
}

export interface ApprovalFilters {
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  eventId?: string;
}