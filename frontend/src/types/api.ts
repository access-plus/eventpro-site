export type UserRole = "ADMIN" | "ORGANIZER" | "USER";

export type UserStatus = "ACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION";

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
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: string;
  name: string;
  description?: string;
  venue?: string;
  startDateTime: string;
  endDateTime: string;
  status: "DRAFT" | "PUBLISHED" | "CANCELLED" | "COMPLETED";
  organizerId: string;
  imageUrl?: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
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
  profilePictureUrl?: string;
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
