export type BookingStatus = 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
export type ServiceType = 'Moving' | 'TV Mounting' | 'Furniture Assembly';

export interface Provider {
  id: string;
  name: string;
  avatar: string;
  avatarAlt: string;
  rating: number;
  reviews: number;
}

export interface Booking {
  id: string;
  service: ServiceType;
  ref: string;
  dateLabel: string; // e.g. "Jun 18, 2025"
  isoDate: string; // yyyy-mm-dd for filtering
  timeWindow: string;
  address: string;
  status: BookingStatus;
  duration: string;
  image: string;
  imageAlt: string;
  provider: Provider;
}

export interface Message {
  id: string;
  name: string;
  avatar: string;
  avatarAlt: string;
  preview: string;
  time: string;
  unread: number;
}

const providerMike: Provider = {
  id: 'provider-mike-rodriguez',
  name: 'Mike Rodriguez',
  avatar: "https://images.unsplash.com/photo-1597214878849-ccd3506e706d",
  avatarAlt: 'Smiling mover in navy cap and polo shirt outdoors',
  rating: 4.9,
  reviews: 128
};
const providerDavid: Provider = {
  id: 'provider-david-kim',
  name: 'David Kim',
  avatar: "https://images.unsplash.com/photo-1641723345380-804552d000fb",
  avatarAlt: 'Bearded man in dark blazer smiling at camera',
  rating: 4.8,
  reviews: 96
};
const providerSarah: Provider = {
  id: 'provider-sarah-johnson',
  name: 'Sarah Johnson',
  avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1a6de9328-1773141085898.png",
  avatarAlt: 'Woman with long brown hair smiling warmly',
  rating: 4.9,
  reviews: 142
};
const providerJames: Provider = {
  id: 'provider-james-brown',
  name: 'James Brown',
  avatar: "https://images.unsplash.com/photo-1695830209166-161b6297541d",
  avatarAlt: 'Man in light shirt with short dark hair smiling',
  rating: 4.7,
  reviews: 88
};
const providerAlex: Provider = {
  id: 'provider-alex-wilson',
  name: 'Alex Wilson',
  avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_119e09d92-1785047445836.png",
  avatarAlt: 'Young man with short hair and light stubble looking at camera',
  rating: 4.6,
  reviews: 73
};
const providerLeo: Provider = {
  id: 'provider-leo-martinez',
  name: 'Leo Martinez',
  avatar: "https://images.unsplash.com/photo-1728072584773-81a2ea45a706",
  avatarAlt: 'Man in dark jacket with trimmed beard smiling',
  rating: 4.8,
  reviews: 61
};

const IMG_MOVING_TRUCK =
'https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=400&h=300&fit=crop';
const IMG_TV =
'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=300&fit=crop';
const IMG_FURNITURE =
'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop';
const IMG_BOXES =
'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=300&fit=crop';
const IMG_TV_WALL =
'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop';

export const bookings: Booking[] = [
{
  id: 'booking-0068',
  service: 'Moving',
  ref: 'MN-2025-0068',
  dateLabel: 'Jun 18, 2025',
  isoDate: '2025-06-18',
  timeWindow: '8:00 AM - 10:00 AM',
  address: '123 Ocean Dr, Miami, FL, 33139',
  status: 'Confirmed',
  duration: '2 hours',
  image: IMG_MOVING_TRUCK,
  imageAlt: 'White MoveNow moving truck with open cargo doors and stacked cardboard boxes',
  provider: providerMike
},
{
  id: 'booking-0067',
  service: 'TV Mounting',
  ref: 'MN-2025-0067',
  dateLabel: 'Jun 25, 2025',
  isoDate: '2025-06-25',
  timeWindow: '2:00 PM - 4:00 PM',
  address: '456 Brickell Ave, Miami, FL, 33131',
  status: 'Pending',
  duration: '2 hours',
  image: IMG_TV,
  imageAlt: 'Flat screen television on a wooden media console in a bright living room',
  provider: providerDavid
},
{
  id: 'booking-0066',
  service: 'Furniture Assembly',
  ref: 'MN-2025-0066',
  dateLabel: 'Jun 12, 2025',
  isoDate: '2025-06-12',
  timeWindow: '10:00 AM - 12:00 PM',
  address: '789 Collins Ave, Miami, FL, 33139',
  status: 'Completed',
  duration: '2 hours',
  image: IMG_FURNITURE,
  imageAlt: 'Tan sofa and armchair set among moving boxes in a living room',
  provider: providerSarah
},
{
  id: 'booking-0063',
  service: 'Moving',
  ref: 'MN-2025-0063',
  dateLabel: 'May 28, 2025',
  isoDate: '2025-05-28',
  timeWindow: '9:00 AM - 11:00 AM',
  address: '321 Washington Ave, Miami, FL, 33139',
  status: 'Completed',
  duration: '2 hours',
  image: IMG_BOXES,
  imageAlt: 'Stack of taped cardboard moving boxes in an empty bright room',
  provider: providerJames
},
{
  id: 'booking-0061',
  service: 'TV Mounting',
  ref: 'MN-2025-0061',
  dateLabel: 'May 20, 2025',
  isoDate: '2025-05-20',
  timeWindow: '1:00 PM - 3:00 PM',
  address: '654 Lincoln Rd, Miami, FL, 33139',
  status: 'Cancelled',
  duration: '2 hours',
  image: IMG_TV_WALL,
  imageAlt: 'Technician adjusting a wall mounted television in a home',
  provider: providerAlex
},
{
  id: 'booking-0058',
  service: 'Furniture Assembly',
  ref: 'MN-2025-0058',
  dateLabel: 'Jun 05, 2025',
  isoDate: '2025-06-05',
  timeWindow: '11:00 AM - 1:00 PM',
  address: '88 NE 2nd Ave, Miami, FL, 33132',
  status: 'Completed',
  duration: '2 hours',
  image: IMG_FURNITURE,
  imageAlt: 'Assembled living room furniture beside unpacked cardboard boxes',
  provider: providerLeo
}];


export const initialMessages: Message[] = [
{
  id: 'msg-sarah',
  name: 'Sarah Johnson',
  avatar: providerSarah.avatar,
  avatarAlt: providerSarah.avatarAlt,
  preview: "Hi! I'm confirming the details for your moving...",
  time: '10:24 AM',
  unread: 2
},
{
  id: 'msg-mike',
  name: 'Mike Rodriguez',
  avatar: providerMike.avatar,
  avatarAlt: providerMike.avatarAlt,
  preview: 'The technician will arrive at 2 PM.',
  time: 'Yesterday',
  unread: 0
},
{
  id: 'msg-lisa',
  name: 'Lisa Carter',
  avatar: "https://images.unsplash.com/photo-1545156592-79e286b5c333",
  avatarAlt: 'Woman with wavy hair smiling in soft daylight',
  preview: 'Thank you for the great service!',
  time: 'Jun 10',
  unread: 0
},
{
  id: 'msg-david',
  name: 'David Kim',
  avatar: providerDavid.avatar,
  avatarAlt: providerDavid.avatarAlt,
  preview: 'Perfect, see you then!',
  time: 'Jun 8',
  unread: 0
}];


export const statusStyles: Record<BookingStatus, {badge: string;dot: string;}> = {
  Confirmed: { badge: 'bg-success/10 text-success', dot: 'bg-success' },
  Pending: { badge: 'bg-warning/10 text-warning', dot: 'bg-warning' },
  Completed: { badge: 'bg-info/10 text-info', dot: 'bg-info' },
  Cancelled: { badge: 'bg-muted text-muted-foreground', dot: 'bg-muted-foreground' }
};

export const dateRanges = [
{ id: 'range-jun-jul', label: 'Jun 2025 - Jul 2025', from: '2025-06-01', to: '2025-07-31' },
{ id: 'range-may-jul', label: 'May 2025 - Jul 2025', from: '2025-05-01', to: '2025-07-31' },
{ id: 'range-all', label: 'All time', from: '2000-01-01', to: '2999-12-31' }];