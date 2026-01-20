import axios, { AxiosInstance } from "axios";
import type {
  ApiResponse,
  User,
  Event,
  Order,
  TicketType,
  CartItem,
  UpdateUserRequest,
  CartResponse,
  AddToCartRequest,
  UpdateCartRequest,
  SignUpRequest,
  LoginRequest,
  AuthResponse,
} from "@/types/api";

class ApiService {
  private api: AxiosInstance;

  constructor() {
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
          // Only redirect to login if user had a token (was authenticated)
          // This prevents redirecting for public endpoints that return 401
          const hadToken = localStorage.getItem("accessToken");
          if (hadToken) {
            // Token expired or invalid - clear tokens and redirect
            localStorage.removeItem("accessToken");
            window.location.href = "/login";
          }
          // If no token, just reject the error (public endpoint failed, don't redirect)
        }
        return Promise.reject(error);
      }
    );
  }

  // User endpoints
  async signUp(data: SignUpRequest): Promise<User> {
    const response = await this.api.post<ApiResponse<User>>(
      "/api/v1/auth/signup",
      data
    );
    return response.data.data;
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.api.post<ApiResponse<AuthResponse>>(
      "/api/v1/auth/login",
      data
    );
    return response.data.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.api.get<ApiResponse<User>>("/api/v1/users/me");
    return response.data.data;
  }

  async updateCurrentUser(data: UpdateUserRequest): Promise<User> {
    const response = await this.api.put<ApiResponse<User>>(
      "/api/v1/users/me",
      data
    );
    return response.data.data;
  }


  // Event endpoints
  async getEvents(page = 1, size = 20, keyword?: string): Promise<Event[]> {
    let url = `/api/v1/events?page=${page}&size=${size}`;
    if (keyword) {
      url += `&keyword=${encodeURIComponent(keyword)}`;
    }
    const response = await this.api.get<ApiResponse<{ content: Event[] }>>(url);
    return response.data.data.content;
  }

  async getEventsByCategory(categoryName: string): Promise<Event[]> {
    const response = await this.api.get<ApiResponse<Event[]>>(
      `/api/v1/events/category/${encodeURIComponent(categoryName)}`
    );
    return response.data.data;
  }

  async getEventById(id: string): Promise<Event> {
    const response = await this.api.get<ApiResponse<Event>>(
      `/api/v1/events/${id}`
    );
    return response.data.data;
  }

  async getUserEvents(): Promise<Event[]> {
    const response = await this.api.get<ApiResponse<Event[]>>(
      "/api/v1/events/my-events"
    );
    return response.data.data;
  }

  // Ticket Type endpoints
  async getEventTicketTypes(eventId: string): Promise<TicketType[]> {
    const response = await this.api.get<ApiResponse<TicketType[]>>(
      `/api/v1/events/${eventId}/ticket-types`
    );
    return response.data.data;
  }

  // Cart endpoints
  async addToCart(items: CartItem[]): Promise<void> {
    await this.api.post("/api/v1/cart/items", items);
  }

  async addToCartSingle(request: AddToCartRequest): Promise<CartResponse> {
    const response = await this.api.post<ApiResponse<CartResponse>>(
      "/api/v1/cart/add",
      request
    );
    return response.data.data;
  }

  async getCart(): Promise<CartResponse> {
    const response = await this.api.get<ApiResponse<CartResponse>>("/api/v1/cart");
    return response.data.data;
  }

  async updateCartItem(ticketId: string, quantity: number): Promise<CartResponse> {
    const response = await this.api.patch<ApiResponse<CartResponse>>(
      `/api/v1/cart/update/${ticketId}`,
      { quantity } as UpdateCartRequest
    );
    return response.data.data;
  }

  async removeFromCart(ticketId: string): Promise<void> {
    await this.api.delete(`/api/v1/cart/delete/${ticketId}`);
  }

  async clearCart(): Promise<void> {
    await this.api.delete("/api/v1/cart/clear");
  }

  // Order endpoints
  async getUserOrders(): Promise<Order[]> {
    const response = await this.api.get<ApiResponse<{ content: Order[] }>>(
      "/api/v1/orders/my-orders"
    );
    return response.data.data.content;
  }

  async getOrderById(id: string): Promise<Order> {
    const response = await this.api.get<ApiResponse<Order>>(
      `/api/v1/orders/${id}`
    );
    return response.data.data;
  }

  async createOrder(): Promise<Order> {
    const response = await this.api.post<ApiResponse<Order>>(
      "/api/v1/orders"
    );
    return response.data.data;
  }

  async requestRefund(orderId: string): Promise<Order> {
    const response = await this.api.post<ApiResponse<Order>>(
      `/api/v1/orders/${orderId}/refund`
    );
    return response.data.data;
  }

  async downloadTicket(ticketId: string): Promise<Blob> {
    const response = await this.api.get(
      `/api/v1/tickets/${ticketId}/download`,
      { responseType: 'blob' }
    );
    return response.data;
  }

  // Payment endpoints
  async createPaymentIntent(amount: number): Promise<{ clientSecret: string }> {
    const response = await this.api.post<ApiResponse<{ clientSecret: string }>>(
      "/api/v1/payments/create-intent",
      { amount }
    );
    return response.data.data;
  }

  async confirmPayment(paymentIntentId: string): Promise<Order> {
    const response = await this.api.post<ApiResponse<Order>>(
      "/api/v1/payments/confirm",
      { paymentIntentId }
    );
    return response.data.data;
  }

  // Admin endpoints
  async getAdminStats(): Promise<any> {
    const response = await this.api.get<ApiResponse<any>>(
      "/api/v1/admin/stats"
    );
    return response.data.data;
  }

  async getEventSales(): Promise<any[]> {
    const response = await this.api.get<ApiResponse<any[]>>(
      "/api/v1/admin/event-sales"
    );
    return response.data.data;
  }

  async getRevenueData(period: string = "30d"): Promise<any[]> {
    const response = await this.api.get<ApiResponse<any[]>>(
      `/api/v1/admin/revenue?period=${period}`
    );
    return response.data.data;
  }

  async getAllEvents(): Promise<Event[]> {
    const response = await this.api.get<ApiResponse<{ content: Event[] }>>(
      "/api/v1/admin/events"
    );
    return response.data.data.content;
  }

  async updateEventStatus(eventId: string, status: string): Promise<Event> {
    const response = await this.api.patch<ApiResponse<Event>>(
      `/api/v1/admin/events/${eventId}/status`,
      { status }
    );
    return response.data.data;
  }

  // Organizer endpoints
  async getOrganizerEvents(): Promise<Event[]> {
    const response = await this.api.get<ApiResponse<Event[]>>(
      "/api/v1/organizer/events"
    );
    return response.data.data;
  }

  async getOrganizerEventStats(eventId: string): Promise<any> {
    const response = await this.api.get<ApiResponse<any>>(
      `/api/v1/organizer/events/${eventId}/stats`
    );
    return response.data.data;
  }

  async getEventAttendees(eventId: string): Promise<any[]> {
    const response = await this.api.get<ApiResponse<any[]>>(
      `/api/v1/organizer/events/${eventId}/attendees`
    );
    return response.data.data;
  }

  async checkInAttendee(ticketId: string): Promise<void> {
    await this.api.post(`/api/v1/organizer/tickets/${ticketId}/check-in`);
  }

  // Note: QR code generation endpoint not implemented in backend
  // QR codes are included in ticket PDF downloads
  // async generateTicketQR(ticketId: string): Promise<{ qrCode: string }> {
  //   const response = await this.api.get<ApiResponse<{ qrCode: string }>>(
  //     `/api/v1/organizer/tickets/${ticketId}/qr`
  //   );
  //   return response.data.data;
  // }

  async createEvent(data: any): Promise<Event> {
    const response = await this.api.post<ApiResponse<Event>>(
      "/api/v1/organizer/events",
      data
    );
    return response.data.data;
  }

  async updateEvent(eventId: string, data: any): Promise<Event> {
    const response = await this.api.put<ApiResponse<Event>>(
      `/api/v1/organizer/events/${eventId}`,
      data
    );
    return response.data.data;
  }

  async uploadEventImage(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append("image", file);
    const response = await this.api.post<ApiResponse<{ url: string }>>(
      "/api/v1/organizer/events/upload-image",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data.data;
  }

  async uploadProfilePicture(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append("image", file);
    const response = await this.api.post<ApiResponse<{ url: string }>>(
      "/api/v1/users/upload-profile-picture",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data.data;
  }

  // Password Reset
  async sendPasswordResetEmail(email: string, code: string): Promise<void> {
    await this.api.post("/api/v1/auth/send-reset-email", { email, code });
  }

  // Admin User Management
  async getAllUsers(): Promise<User[]> {
    const response = await this.api.get<ApiResponse<{ content: User[] }>>(
      "/api/v1/admin/users"
    );
    return response.data.data.content;
  }

  async updateUser(userId: string, data: Partial<User>): Promise<User> {
    const response = await this.api.put<ApiResponse<User>>(
      `/api/v1/admin/users/${userId}`,
      data
    );
    return response.data.data;
  }

  async updateUserStatus(userId: string, status: string): Promise<User> {
    const response = await this.api.patch<ApiResponse<User>>(
      `/api/v1/admin/users/${userId}/status`,
      { status }
    );
    return response.data.data;
  }

  async updateUserRole(userId: string, role: string): Promise<User> {
    const response = await this.api.patch<ApiResponse<User>>(
      `/api/v1/admin/users/${userId}/role`,
      { role }
    );
    return response.data.data;
  }
}

export const apiService = new ApiService();
