export type UserRole = 'client' | 'driver' | 'admin';

export type Language = 'ar' | 'en';

export type VehicleCategory = 'economy' | 'sedan' | 'motorcycle' | 'comfort';

export interface Vehicle {
  id: string;
  category: VehicleCategory;
  nameAr: string;
  nameEn: string;
  model: string;
  year: number;
  color: string;
  plateNumber: string; // e.g. "أ ب ج ١٢٣٤"
  photoUrl: string;
  capacity: number;
  basePricePerKm: number;
  baseFare: number;
}

export interface DriverDocument {
  id: string;
  type: 'national_id' | 'driver_license' | 'car_license' | 'criminal_record' | 'car_inspection';
  titleAr: string;
  titleEn: string;
  fileUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  uploadedAt: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar: string;
  rating: number;
  totalTrips: number;
  acceptanceRate: number;
  cancellationRate: number;
  vehicle: Vehicle;
  isOnline: boolean;
  status: 'active' | 'suspended' | 'pending_verification';
  walletBalance: number;
  currentLocation: {
    lat: number;
    lng: number;
    heading?: number;
    address?: string;
  };
  documents: DriverDocument[];
  joinedDate: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar: string;
  rating: number;
  totalTrips: number;
  walletBalance: number;
  status: 'active' | 'blocked';
  joinedDate: string;
  favorites: {
    id: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
    type: 'home' | 'work' | 'other';
  }[];
}

export type TripStatus =
  | 'negotiating'        // العميل طلب والطلب مفتوح لعروض الكباتن
  | 'offer_accepted'    // العميل قبل عرض كابتن وتم تثبيت السعر
  | 'driver_arriving'   // الكابتن في الطريق لنقطة الركوب
  | 'arrived_pickup'    // الكابتن وصل لنقطة الركوب
  | 'in_trip'           // الرحلة بدأت ومتجهة للوجهة
  | 'completed'         // تم الوصول والإنهاء
  | 'cancelled';        // تم الإلغاء

export interface NegotiationBid {
  id: string;
  tripId: string;
  driverId: string;
  driverName: string;
  driverAvatar: string;
  driverRating: number;
  vehicleModel: string;
  vehicleColor: string;
  plateNumber: string;
  driverDistanceKm: number;
  estimatedArrivalMinutes: number;
  proposedPrice: number;
  createdAt: string;
  status: 'pending' | 'accepted' | 'rejected' | 'countered';
}

export interface ChatMessage {
  id: string;
  tripId: string;
  senderId: string;
  senderType: 'client' | 'driver' | 'system';
  senderName: string;
  text: string;
  timestamp: string;
}

export interface TripLocation {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export interface Trip {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientAvatar: string;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  driverAvatar?: string;
  driverVehicle?: Vehicle;
  pickup: TripLocation;
  dropoff: TripLocation;
  distanceKm: number;
  estimatedMinutes: number;
  vehicleCategory: VehicleCategory;
  suggestedSystemPrice: number;
  clientInitialPrice: number;
  agreedPrice?: number;
  platformCommission: number;
  driverEarnings?: number;
  paymentMethod: 'cash';
  clientNotes?: string; // ملاحظات وتعليمات من العميل للكابتن
  status: TripStatus;
  bids: NegotiationBid[];
  activeBidExpirySeconds?: number;
  messages: ChatMessage[];
  routePolyline?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  clientRating?: number;
  clientFeedback?: string;
  driverRating?: number;
  driverFeedback?: string;
  cancellationReason?: string;
  cancelledBy?: 'client' | 'driver' | 'admin';
}

export interface CityZone {
  id: string;
  nameAr: string;
  nameEn: string;
  governorateAr: string;
  governorateEn: string;
  center: { lat: number; lng: number };
  radiusKm: number;
  isActive: boolean;
  baseFareEconomy: number;
  baseFareSedan: number;
  baseFareMotorcycle: number;
  perKmRate: number;
  surgeMultiplier: number;
}

export interface NegotiationSettings {
  minPricePerKm: number;
  maxPricePerKm: number;
  standardPricePerKm: number;
  minTripFare: number;
  preventBiddingBelowSuggested: boolean;
  maxNegotiationPercent: number; // أقصى نسبة تفاوض (60%)
  platformCommissionPercent: number;
  biddingWindowSeconds: number;
  maxBidsAllowedPerTrip: number;
  searchRadiusKm: number;
  isNegotiationEnabled: boolean;
  antiPriceManipulation: boolean;
  driverCancellationFee: number;
  clientCancellationFee: number;
}

export type MapProvider = 'free_osm' | 'google_maps';

export type PaymentTopupMethod =
  | 'fawry'
  | 'vodafone_cash'
  | 'orange_cash'
  | 'etisalat_cash'
  | 'we_pay'
  | 'instapay'
  | 'bank_transfer'
  | 'cash';

export interface TopupRequest {
  id: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  amount: number;
  method: PaymentTopupMethod;
  fawryCode?: string;
  senderPhone?: string;
  referenceNumber?: string;
  status: 'pending' | 'completed' | 'rejected';
  createdAt: string;
  notes?: string;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  userType: 'driver' | 'client';
  userName: string;
  amount: number;
  type: 'trip_fare' | 'commission_deduct' | 'topup' | 'withdrawal' | 'bonus' | 'penalty';
  method?: PaymentTopupMethod;
  status: 'completed' | 'pending' | 'rejected';
  referenceId?: string;
  createdAt: string;
  description: string;
}

export interface SupportDepartment {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  headOfficerName?: string;
  slaHours: number;
  color: string;
  isActive: boolean;
}

export interface SupportOfficer {
  id: string;
  name: string;
  role: string;
  departmentId: string;
  departmentName: string;
  phone: string;
  email: string;
  avatar: string;
  assignedComplaintsCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface ComplaintLog {
  id: string;
  officerName: string;
  action: string;
  note: string;
  timestamp: string;
}

export interface Complaint {
  id: string;
  tripId?: string;
  complainantId: string;
  complainantName: string;
  complainantType: 'client' | 'driver';
  subject: string;
  details: string;
  departmentId?: string;
  departmentName?: string; // تعيين قسم الشكاوى
  assignedOfficerId?: string; // تعيين مسؤول يتابع الشكوى
  assignedOfficerName?: string;
  priority?: 'high' | 'medium' | 'low';
  status: 'open' | 'in_review' | 'resolved' | 'escalated';
  createdAt: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  logs?: ComplaintLog[];
}

