export interface Client {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  createdAt: string;
  packages?: Package[];
  _count?: { users: number };
}

export interface Package {
  id: string;
  clientId: string;
  type: 'raffle' | 'raffle_count';
  value: string;
  active: boolean;
  createdAt: string;
}

export interface Raffle {
  id: string;
  organizerId: string;
  title: string;
  prizeDescription: string;
  prizeImage: string | null;
  ticketPrice: number;
  totalTickets: number;
  domain: string;
  status: 'draft' | 'active' | 'closed';
  createdAt: string;
  soldCount?: number;
  orders?: TicketOrder[];
}

export interface Ticket {
  id: string;
  raffleId: string;
  number: string;
  status: 'available' | 'reserved' | 'paid';
  reservedUntil: string | null;
  buyerId: string | null;
}

export interface TicketOrder {
  id: string;
  raffleId: string;
  ticketIds: string[];
  buyerName: string;
  buyerPhone: string;
  buyerCity: string;
  receiptImage: string | null;
  status: 'pending' | 'confirmed' | 'rejected';
  createdAt: string;
}

export interface RaffleLimit {
  limit: number;
  used: number;
  canCreate: boolean;
}

export interface PublicRaffle extends Raffle {
  tickets: Ticket[];
}
