// UI types for booking status and service. Bookings and messages come from the API (see app/lib/api).

export type BookingStatus = 'Pending' | 'Confirmed' | 'In progress' | 'Completed' | 'Cancelled';
export type ServiceType = 'Moving' | 'TV Mounting' | 'Furniture Assembly';

export const statusStyles: Record<BookingStatus, { badge: string; dot: string }> = {
  Confirmed: { badge: 'bg-success/10 text-success', dot: 'bg-success' },
  Pending: { badge: 'bg-warning/10 text-warning', dot: 'bg-warning' },
  'In progress': { badge: 'bg-accent/10 text-accent-strong', dot: 'bg-accent-strong' },
  Completed: { badge: 'bg-info/10 text-info', dot: 'bg-info' },
  Cancelled: { badge: 'bg-muted text-muted-foreground', dot: 'bg-muted-foreground' },
};
