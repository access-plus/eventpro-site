import axios, { AxiosInstance } from "axios";
import type {
  ApiResponse,
  User,
  Event,
  Order,
  TicketType,
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
    const response = await this.api.put<ApiResponse<CartResponse>>(`/api/v1/cart/${ticketId}`, data);
    return response.data.data;
  }

  async removeFromCart(ticketId: string): Promise<CartResponse> {
    const response = await this.api.delete<ApiResponse<CartResponse>>(`/api/v1/cart/${ticketId}`);
    return response.data.data;
  }

  async clearCart(): Promise<void> {
    await this.api.delete("/api/v1/cart");
  }

  // Order endpoints
  async getOrders(): Promise<Order[]> {
    const response = await this.api.get<ApiResponse<Order[]>>("/api/v1/orders");
    return response.data.data;
  }

  async getOrder(id: string): Promise<Order> {
    const response = await this.api.get<ApiResponse<Order>>(`/api/v1/orders/${id}`);
    return response.data.data;
  }

  async createOrder(): Promise<Order> {
    const response = await this.api.post<ApiResponse<Order>>("/api/v1/orders");
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
  async getOrganizerEvents(): Promise<Event[]> {
    const response = await this.api.get<ApiResponse<Event[]>>("/api/v1/organizer/events");
    return response.data.data;
  }
}

export const apiService = new ApiService();
