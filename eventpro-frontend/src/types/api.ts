export type UserRole = "ADMIN" | "ORGANIZER" | "USER";

export type VerificationStatus = "NOT_STARTED" | "PENDING" | "IN_PROGRESS" | "VERIFIED" | "REJECTED";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type UserStatus = "ACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION";

/** Plan tier from pricing page: Basic (free), Pro, Enterprise. Used for feature gating. */
export type SubscriptionTier = "BASIC" | "PRO" | "ENTERPRISE";

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  profilePictureUrl?: string;
  bio?: string;
  location?: string;
  role: UserRole;
  status: UserStatus;
  /** Plan tier for feature gating (add-ons, early payouts, custom domain, etc.). Defaults to BASIC. */
  subscriptionTier?: SubscriptionTier;
  /** True when tax/ID and risk check passed; gates payouts for organizers. */
  isVerified?: boolean;
  /** KYC workflow: NOT_STARTED, PENDING, IN_PROGRESS, VERIFIED, REJECTED. */
  verificationStatus?: VerificationStatus;
  /** Risk level: LOW, MEDIUM, HIGH. */
  riskLevel?: RiskLevel;
  /** Organizer cultural niche / focus; feeds search taxonomy. */
  culturalNiche?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: string;
  name: string;
  /** Some endpoints may return title instead of name; card displays name || title. */
  title?: string;
  description?: string;
  imageUrl?: string;
  marketingEnabled?: boolean;
  startTime: string;
  endTime: string;
  userId?: string;
  categoryId?: string;
  categoryName?: string;
  addressStreet?: string;
  addressCity?: string;
  addressState?: string;
  addressCountry?: string;
  addressZipCode?: string;
  // Computed fields for compatibility
  startDateTime?: string;
  endDateTime?: string;
  status?: "DRAFT" | "PUBLISHED" | "CANCELLED" | "COMPLETED";
  organizerId?: string;
  venue?: string;
  category?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface EventAddon {
  id: string;
  eventId: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  imageUrl?: string;
  sizes?: string[];
  isPopular?: boolean;
  displayOrder?: number;
}

export interface TicketType {
  id: string;
  eventId: string;
  name: string;
  description?: string;
  price: number;
  totalQuantity: number;
  availableQuantity: number;
  saleStartDate?: string;
  saleEndDate?: string;
  status: "ACTIVE" | "INACTIVE" | "SOLD_OUT";
}

export interface Ticket {
  id: string;
  eventId: string;
  userId: string;
  ticketTypeId: string;
  status: "ACTIVE" | "USED" | "CANCELLED" | "REFUNDED";
  purchasePrice: number;
  qrCode?: string;
  purchaseDate: string;
}

export interface Order {
  id: string;
  userId: string;
  totalAmount: number;
  status: "PENDING" | "COMPLETED" | "CANCELLED" | "REFUNDED";
  createdAt: string;
  tickets: Ticket[];
}

export type TicketTypeEnum = "VIP" | "REGULAR" | "EARLY_BIRD";
export type TicketStatusEnum = "AVAILABLE" | "SOLD" | "RESERVED" | "USED" | "CANCELLED" | "REFUNDED";

export interface CartItem {
  ticketTypeId: string;
  quantity: number;
}

export interface CartItemResponse {
  id: string;
  name: string;
  ticketType: TicketTypeEnum;
  ticketStatus: TicketStatusEnum;
  price: number;
  startTime?: string;
  endTime?: string;
  eventIdType?: string;
  quantity: number;
}

export interface CartResponse {
  id: string;
  tickets: CartItemResponse[];
  quantity: number;
  totalCost: number;
  /** When the cart reservation expires (ISO-8601). For countdown. */
  reservedUntil?: string;
  message?: string;
}

export interface AddToCartRequest {
  id?: string;
  eventIdType?: string;
  ticketType?: TicketTypeEnum;
  quantity: number;
}

export interface UpdateCartRequest {
  quantity: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp?: string;
}

export interface AuthResponse {
  accessToken: string;
  expiresIn: number;
  user: User;
}

export interface SignUpRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role?: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  bio?: string;
  location?: string;
  profilePictureUrl?: string;
  culturalNiche?: string;
}

/** Organizer dashboard summary for Profile "Your Impact" and Organizer page. */
export interface OrganizerSummary {
  eventsHosted: number;
  ticketsSold: number;
  ticketsSoldTrendPercent: number | null;
  totalRevenue: number;
  availableBalance: number;
  pendingBalance: number;
  riskFlagged: boolean;
  riskLevel?: RiskLevel;
  /** True when W-9 submitted for 1099-K. */
  w9Submitted?: boolean;
}

/** One tax form row for Document Vault. */
export interface TaxFormEntry {
  year: string;
  formType: string;
  status: "Available" | "Generating";
  downloadUrl?: string | null;
}

export interface SubmitW9Request {
  legalName: string;
  businessName?: string;
  tinType: "SSN" | "EIN";
  tin: string;
  signatureAcknowledged?: boolean;
}

export interface VerificationStatusResponse {
  verificationStatus: VerificationStatus;
  riskLevel: RiskLevel;
  canResubmit: boolean;
  lastSubmittedAt: string | null;
  /** Reason for rejection when status is REJECTED (e.g. "Address doesn't match ID"). */
  lastRejectionReason?: string | null;
}

export interface SubmitVerificationRequest {
  legalEntityType: "INDIVIDUAL" | "BUSINESS";
  /** Last 4 digits of SSN for individuals (1099-K). */
  ssnLast4?: string;
  /** EIN for businesses. */
  ein?: string;
  addressStreet: string;
  addressCity: string;
  addressState: string;
  addressZip: string;
  idSessionId?: string;
  idProvider?: string;
}

export interface AdminStats {
  totalUsers: number;
  totalEvents: number;
  totalTicketsSold: number;
  totalRevenue: number;
  userGrowth: number;
  eventGrowth: number;
  ticketGrowth: number;
  revenueGrowth: number;
}

export interface EventSales {
  eventId: string;
  eventName: string;
  ticketsSold: number;
  revenue: number;
  availableTickets: number;
  totalTickets: number;
}

export interface RevenueData {
  date: string;
  revenue: number;
  ticketsSold: number;
}

/** Request to create a Stripe payment intent (amount in dollars). */
export interface CreatePaymentIntentRequest {
  amount: number;
}

/** Guest checkout: confirm payment and create order (no account). */
export interface GuestConfirmPaymentRequest {
  paymentIntentId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  items: { eventId: string; ticketType: string; quantity: number }[];
  totalAmount: number;
  /** Ticket IDs from guest-reserve (lock). Send when you called guest-reserve before payment. */
  reservedTicketIds?: string[];
  /** Optional: attribution for discovery / cultural taxonomy. */
  howDidYouHear?: string;
  /** Optional: send ticket via WhatsApp. */
  receiveTicketViaWhatsApp?: boolean;
  /** Optional: send ticket via SMS. */
  receiveTicketViaSMS?: boolean;
}

/** Options for "How did you hear about this event?" (cultural taxonomy). */
export const HOW_DID_YOU_HEAR_OPTIONS = [
  { value: "", label: "Select (optional)" },
  { value: "social_media", label: "Social media" },
  { value: "friend_family", label: "Friend or family" },
  { value: "search", label: "Search / Google" },
  { value: "community", label: "Community group" },
  { value: "email", label: "Email / newsletter" },
  { value: "event_listing", label: "Event listing site" },
  { value: "other", label: "Other" },
] as const;

/** One row in the live ticket sales feed. */
export interface RecentSale {
  orderId: string;
  buyerName: string;
  quantity: number;
  ticketTypeName: string;
  eventName: string;
  soldAt: string;
}

/** Sales velocity pulse for an event. */
export interface EventPulse {
  eventId: string;
  eventName: string;
  velocity: "trending_up" | "steady" | "slowing";
  percentChange: number | null;
  label: string;
}

/** Top cultural interest (category) for donut. */
export interface CulturalInterest {
  name: string;
  count: number;
}

/** AI insights payload for Command Center. */
export interface OrganizerInsights {
  aiInsight: string;
  eventPulses: EventPulse[];
  topCulturalInterests: CulturalInterest[];
}
