import axios, { AxiosInstance } from "axios";
import type {
  ApiResponse,
  ApiKey,
  User,
  Event,
  EventAddon,
  Order,
  TicketType,
  Attendee,
  UpdateUserRequest,
  CartResponse,
  AddToCartRequest,
  UpdateCartRequest,
  SignUpRequest,
  LoginRequest,
  AuthResponse,
  GuestConfirmPaymentRequest,
  CreateApiKeyResponse,
  OrganizerSummary,
  VerificationStatusResponse,
  SubmitVerificationRequest,
  TaxFormEntry,
  SubmitW9Request as SubmitW9RequestType,
  RecentSale,
  OrganizerInsights,
  TeamMember,
  SeatResponse,
  CreateSeatMapRequest,
} from "@/types/api";

class ApiService {
  private api: AxiosInstance;

  constructor() {
    // Default to localhost for development - set VITE_API_BASE_URL in production
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add request interceptor to attach token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("accessToken");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          const hadToken = localStorage.getItem("accessToken");
          if (hadToken) {
            localStorage.removeItem("accessToken");
            window.location.href = "/login";
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // User endpoints
  async getCurrentUser(): Promise<User> {
    const response = await this.api.get<ApiResponse<User>>("/api/v1/users/me");
    return response.data.data;
  }

  /** Upgrade subscription tier (Basic → Pro or Enterprise). Returns updated user. */
  async upgradeSubscription(tier: "PRO" | "ENTERPRISE"): Promise<User> {
    const response = await this.api.put<ApiResponse<User>>("/api/v1/users/me/subscription-tier", { tier });
    return response.data.data;
  }

  /** Create API key (Enterprise only). Returns key once – store it securely. */
  async createApiKey(name: string): Promise<CreateApiKeyResponse> {
    const response = await this.api.post<ApiResponse<CreateApiKeyResponse>>("/api/v1/users/me/api-keys", { name });
    return response.data.data;
  }

  /** List API keys (Enterprise only). Key values are not returned. */
  async listApiKeys(): Promise<ApiKey[]> {
    const response = await this.api.get<ApiResponse<ApiKey[]>>("/api/v1/users/me/api-keys");
    return response.data.data ?? [];
  }

  /** Revoke an API key (Enterprise only). */
  async revokeApiKey(id: string): Promise<void> {
    await this.api.delete(`/api/v1/users/me/api-keys/${id}`);
  }

  async updateUser(data: UpdateUserRequest): Promise<User> {
    const response = await this.api.put<ApiResponse<User>>("/api/v1/users/me", data);
    return response.data.data;
  }

  // Auth endpoints
  async signUp(data: SignUpRequest): Promise<void> {
    await this.api.post("/api/v1/auth/signup", data);
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.api.post<ApiResponse<AuthResponse>>("/api/v1/auth/login", data);
    return response.data.data;
  }

  // Event endpoints
  async getEvents(page = 1, size = 20, keyword?: string): Promise<Event[]> {
    const params = new URLSearchParams();
    params.append("page", String(page - 1));
    params.append("size", String(size));
    if (keyword) params.append("keyword", keyword);
    
    const response = await this.api.get<ApiResponse<{ content: Event[] }>>(`/api/v1/events?${params}`);
    return response.data.data.content || [];
  }

  async getEventsByCategory(category: string): Promise<Event[]> {
    const response = await this.api.get<ApiResponse<Event[]>>(`/api/v1/events/category/${category}`);
    return response.data.data;
  }

  async getEvent(id: string): Promise<Event> {
    const response = await this.api.get<ApiResponse<Event>>(`/api/v1/events/${id}`);
    return response.data.data;
  }

  async createEvent(data: Partial<Event>): Promise<Event> {
    const response = await this.api.post<ApiResponse<Event>>("/api/v1/events", data);
    return response.data.data;
  }

  async updateEvent(id: string, data: Partial<Event>): Promise<Event> {
    const response = await this.api.put<ApiResponse<Event>>(`/api/v1/events/${id}`, data);
    return response.data.data;
  }

  async deleteEvent(id: string): Promise<void> {
    await this.api.delete(`/api/v1/events/${id}`);
  }

  // Ticket type endpoints
  async getTicketTypes(eventId: string): Promise<TicketType[]> {
    const response = await this.api.get<ApiResponse<TicketType[]>>(`/api/v1/events/${eventId}/ticket-types`);
    return response.data.data;
  }

  /** Reserved seating: get seat map for an event (when reservedSeatingEnabled). */
  async getEventSeats(eventId: string): Promise<SeatResponse[]> {
    const response = await this.api.get<ApiResponse<SeatResponse[]>>(`/api/v1/events/${eventId}/seats`);
    return response.data.data ?? [];
  }

  /** Create seat map for an event (Pro/Enterprise, organizer). Requires reservedSeatingEnabled on event. */
  async createEventSeatMap(eventId: string, body: CreateSeatMapRequest): Promise<{ seatsCreated: number }> {
    const response = await this.api.post<ApiResponse<{ seatsCreated: number }>>(
      `/api/v1/organizer/events/${eventId}/seat-map`,
      body
    );
    return response.data.data ?? { seatsCreated: 0 };
  }

  // Event add-ons (enhancements) - public for checkout
  async getEventAddons(eventId: string): Promise<EventAddon[]> {
    const response = await this.api.get<ApiResponse<EventAddon[]>>(`/api/v1/events/${eventId}/addons`);
    return response.data.data ?? [];
  }

  // Organizer: event add-ons CRUD
  async getOrganizerEventAddons(eventId: string): Promise<EventAddon[]> {
    const response = await this.api.get<ApiResponse<EventAddon[]>>(`/api/v1/organizer/events/${eventId}/addons`);
    return response.data.data ?? [];
  }

  async createEventAddon(eventId: string, data: { name: string; description?: string; price: number; category: string; imageUrl?: string; sizes?: string[]; isPopular?: boolean; displayOrder?: number }): Promise<EventAddon> {
    const response = await this.api.post<ApiResponse<EventAddon>>(`/api/v1/organizer/events/${eventId}/addons`, data);
    return response.data.data;
  }

  async updateEventAddon(eventId: string, addonId: string, data: Partial<{ name: string; description: string; price: number; category: string; imageUrl: string; sizes: string[]; isPopular: boolean; displayOrder: number }>): Promise<EventAddon> {
    const response = await this.api.put<ApiResponse<EventAddon>>(`/api/v1/organizer/events/${eventId}/addons/${addonId}`, data);
    return response.data.data;
  }

  async deleteEventAddon(eventId: string, addonId: string): Promise<void> {
    await this.api.delete(`/api/v1/organizer/events/${eventId}/addons/${addonId}`);
  }

  // Cart endpoints
  async getCart(): Promise<CartResponse> {
    const response = await this.api.get<ApiResponse<CartResponse>>("/api/v1/cart");
    return response.data.data;
  }

  async addToCart(data: AddToCartRequest): Promise<CartResponse> {
    const response = await this.api.post<ApiResponse<CartResponse>>("/api/v1/cart/add", data);
    return response.data.data;
  }

  async updateCartItem(ticketId: string, data: UpdateCartRequest): Promise<CartResponse> {
    const response = await this.api.patch<ApiResponse<CartResponse>>(`/api/v1/cart/update/${ticketId}`, data);
    return response.data.data;
  }

  async removeFromCart(ticketId: string): Promise<CartResponse> {
    const response = await this.api.delete<ApiResponse<CartResponse>>(`/api/v1/cart/delete/${ticketId}`);
    return response.data.data;
  }

  async clearCart(): Promise<void> {
    await this.api.delete("/api/v1/cart/clear");
  }

  // Order endpoints (backend returns paginated { content: [...] }; shape may use amount/orderItems)
  async getOrders(page = 1, size = 50): Promise<unknown[]> {
    const response = await this.api.get<ApiResponse<{ content: unknown[] }>>(
      `/api/v1/orders?page=${page}&size=${size}`
    );
    const data = response.data.data;
    return Array.isArray(data?.content) ? data.content : [];
  }

  async getOrder(id: string): Promise<Order> {
    const response = await this.api.get<ApiResponse<Order>>(`/api/v1/orders/${id}`);
    return response.data.data;
  }

  async createOrder(): Promise<Order> {
    const response = await this.api.post<ApiResponse<Order>>("/api/v1/orders");
    return response.data.data;
  }

  /** Reserve tickets for guest (lock) before payment. Returns ticket IDs and reservedUntil (ISO-8601) for countdown. */
  async guestReserve(items: { eventId: string; ticketType: string; quantity: number }[]): Promise<{
    reservedTicketIds: string[];
    reservedUntil: string;
  }> {
    const response = await this.api.post<ApiResponse<{ reservedTicketIds: string[]; reservedUntil: string }>>(
      "/api/v1/payments/guest-reserve",
      { items }
    );
    return response.data.data;
  }

  /** Get payment config (Stripe publishable key). Public – no auth. */
  async getPaymentConfig(): Promise<{ stripePublishableKey: string }> {
    const response = await this.api.get<ApiResponse<{ stripePublishableKey: string }>>("/api/v1/payments/config");
    return response.data.data ?? { stripePublishableKey: "" };
  }

  /** Create Stripe payment intent (amount in dollars). Public – works for guest. */
  async createPaymentIntent(amount: number): Promise<{ clientSecret: string }> {
    const response = await this.api.post<ApiResponse<{ clientSecret: string }>>("/api/v1/payments/create-intent", {
      amount: Number(amount.toFixed(2)),
    });
    return response.data.data;
  }

  /** Confirm guest payment and create order (no auth). */
  async confirmGuestPayment(body: GuestConfirmPaymentRequest): Promise<Order> {
    const response = await this.api.post<ApiResponse<Order>>("/api/v1/payments/guest/confirm", body);
    return response.data.data;
  }

  /** Confirm payment for authenticated user (creates order from cart). */
  async confirmPayment(paymentIntentId: string): Promise<Order> {
    const response = await this.api.post<ApiResponse<Order>>("/api/v1/payments/confirm", {
      paymentIntentId,
    });
    return response.data.data;
  }

  // Admin endpoints
  async getAllUsers(): Promise<User[]> {
    const response = await this.api.get<ApiResponse<User[]>>("/api/v1/admin/users");
    return response.data.data;
  }

  async updateUserRole(userId: string, role: string): Promise<User> {
    const response = await this.api.put<ApiResponse<User>>(`/api/v1/admin/users/${userId}/role`, { role });
    return response.data.data;
  }

  async updateUserStatus(userId: string, status: string): Promise<User> {
    const response = await this.api.put<ApiResponse<User>>(`/api/v1/admin/users/${userId}/status`, { status });
    return response.data.data;
  }

  // Organizer endpoints
  async getOrganizerSummary(): Promise<OrganizerSummary> {
    const response = await this.api.get<ApiResponse<OrganizerSummary>>("/api/v1/organizer/summary");
    const d = response.data.data;
    const toNum = (v: unknown) =>
      typeof v === "number" && !Number.isNaN(v) ? v : typeof v === "string" ? parseFloat(v) || 0 : 0;
    const pe = d.payoutEligibility;
    return {
      eventsHosted: d.eventsHosted ?? 0,
      ticketsSold: d.ticketsSold ?? 0,
      ticketsSoldTrendPercent: d.ticketsSoldTrendPercent ?? null,
      totalRevenue: toNum(d.totalRevenue),
      availableBalance: toNum(d.availableBalance),
      pendingBalance: toNum(d.pendingBalance),
      riskFlagged: Boolean(d.riskFlagged),
      riskLevel: d.riskLevel ?? "LOW",
      w9Submitted: Boolean(d.w9Submitted),
      payoutEligibility: pe
        ? {
            standardT2: Boolean(pe.standardT2),
            early50Percent: Boolean(pe.early50Percent),
            instant100: Boolean(pe.instant100),
            label: pe.label ?? "Standard (T+2)",
          }
        : undefined,
    };
  }

  async getOrganizerTaxForms(): Promise<TaxFormEntry[]> {
    const response = await this.api.get<ApiResponse<TaxFormEntry[]>>("/api/v1/organizer/tax-forms");
    return response.data.data ?? [];
  }

  async submitW9(data: SubmitW9RequestType): Promise<void> {
    await this.api.post<ApiResponse<string>>("/api/v1/organizer/w9", data);
  }

  async getVerificationStatus(): Promise<VerificationStatusResponse> {
    const response = await this.api.get<ApiResponse<VerificationStatusResponse>>("/api/v1/organizer/verification-status");
    return response.data.data;
  }

  /** Recalculate organizer risk level (LOW/MEDIUM/HIGH). Returns updated riskLevel. */
  async recalculateRiskScore(): Promise<{ riskLevel: string }> {
    const response = await this.api.post<ApiResponse<{ riskLevel: string }>>("/api/v1/organizer/risk-score/recalculate");
    return response.data.data;
  }

  async submitVerification(data: SubmitVerificationRequest): Promise<void> {
    await this.api.post<ApiResponse<string>>("/api/v1/organizer/verification", data);
  }

  async getOrganizerEvents(): Promise<Event[]> {
    const response = await this.api.get<ApiResponse<Event[]>>("/api/v1/organizer/events");
    return response.data.data;
  }

  /** Update event (organizer). Sends JSON; use uploadEventImage first if changing image. */
  async updateOrganizerEvent(
    id: string,
    data: Partial<Event> & { startTime?: string; endTime?: string; category?: string; address?: Event["address"] }
  ): Promise<Event> {
    const response = await this.api.put<ApiResponse<Event>>(`/api/v1/organizer/events/${id}`, data);
    return response.data.data;
  }

  /** Upload event image. Returns { url }. Use param name "image" for the file. */
  async uploadEventImage(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append("image", file);
    // Remove Content-Type so browser/axios sets multipart/form-data with boundary (instance default is application/json)
    const response = await this.api.post<ApiResponse<{ url: string }>>(
      "/api/v1/organizer/events/upload-image",
      formData,
      { headers: { "Content-Type": false } as unknown as Record<string, string> }
    );
    const url = response.data.data?.url ?? (response.data as { data?: { url?: string } }).data?.url;
    return { url: url ?? "" };
  }

  /** Publish event (DRAFT → PUBLISHED). Requires organizer role. */
  async publishEvent(eventId: string): Promise<Event> {
    const response = await this.api.post<ApiResponse<Event>>(`/api/v1/events/${eventId}/publish`);
    return response.data.data;
  }

  /** Get attendees for an event (organizer only). */
  async getEventAttendees(eventId: string): Promise<Attendee[]> {
    const response = await this.api.get<ApiResponse<Attendee[]>>(`/api/v1/organizer/events/${eventId}/attendees`);
    return response.data.data ?? [];
  }

  /** Email all attendees of an event (Pro/Enterprise only). Returns { recipientsSent }. */
  async emailEventAttendees(eventId: string, payload: { subject: string; body: string }): Promise<{ recipientsSent: number }> {
    const response = await this.api.post<ApiResponse<{ recipientsSent: number }>>(
      `/api/v1/organizer/events/${eventId}/email-attendees`,
      payload
    );
    const data = response.data.data as { recipientsSent?: number } | undefined;
    return { recipientsSent: data?.recipientsSent ?? 0 };
  }

  /** Export data (attendees, checkin, marketing, financial). Triggers file download. */
  async exportOrganizerData(type: "attendees" | "checkin" | "marketing" | "financial", format = "csv"): Promise<void> {
    const response = await this.api.get<Blob>(`/api/v1/organizer/export?type=${type}&format=${format}`, {
      responseType: "blob",
    });
    const blob = response.data;
    const name = type === "checkin" ? "check-in-list.csv" : type === "marketing" ? "marketing-emails.csv" : type === "financial" ? "financial-summary.csv" : "export-attendees.csv";
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  async getOrganizerRecentSales(limit = 20): Promise<RecentSale[]> {
    const response = await this.api.get<ApiResponse<RecentSale[]>>(`/api/v1/organizer/feed/recent-sales?limit=${limit}`);
    return response.data.data ?? [];
  }

  async getOrganizerInsights(): Promise<OrganizerInsights> {
    const response = await this.api.get<ApiResponse<OrganizerInsights>>("/api/v1/organizer/insights");
    return response.data.data ?? { aiInsight: "", eventPulses: [], topCulturalInterests: [] };
  }

  // Team management (Pro/Enterprise)
  async listTeamMembers(): Promise<TeamMember[]> {
    const response = await this.api.get<ApiResponse<TeamMember[]>>("/api/v1/organizer/team");
    return response.data.data ?? [];
  }

  async inviteTeamMember(email: string, role: "ADMIN" | "EDITOR" | "VIEWER"): Promise<TeamMember> {
    const response = await this.api.post<ApiResponse<TeamMember>>("/api/v1/organizer/team", { email: email.trim(), role });
    return response.data.data;
  }

  async removeTeamMember(userId: string): Promise<void> {
    await this.api.delete(`/api/v1/organizer/team/${userId}`);
  }

  async updateTeamMemberRole(userId: string, role: "ADMIN" | "EDITOR" | "VIEWER"): Promise<TeamMember> {
    const response = await this.api.put<ApiResponse<TeamMember>>(`/api/v1/organizer/team/${userId}/role`, { role });
    return response.data.data;
  }
}

export const apiService = new ApiService();
