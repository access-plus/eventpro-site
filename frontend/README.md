# EventPro - Event Ticketing Platform

A modern, full-featured event ticketing platform built with React, TypeScript, and JWT authentication.

## 🚀 Features

- **Multi-Role Authentication**: Support for three user roles (USER, ORGANIZER, ADMIN)
- **JWT Authentication**: Secure authentication with JWT tokens
- **Password Reset Flow**: Forgot password with email verification and secure reset
- **Password Strength Validator**: Real-time password strength checking with visual feedback
- **Profile Management**: Edit user profiles with profile picture upload
- **Role-Based Access Control**: Protected routes for different user types
- **Beautiful UI**: Modern design with gradient accents and smooth animations
- **Responsive Design**: Fully responsive with mobile-friendly navigation
- **Event Management**: Browse and discover events with cart functionality
- **Stripe Integration**: Secure payment processing for event tickets
- **API Integration**: Full integration with EventPro backend API

## 🏗️ Architecture

### User Roles

- **USER**: Can browse events, buy tickets, and view their purchases
- **ORGANIZER**: Can create and manage events
- **ADMIN**: Full platform administration capabilities

### Key Pages

- **Home**: Landing page with features showcase
- **Events**: Browse and search events with detailed views
- **Profile**: Role-specific dashboard with profile editing
- **Profile Edit**: User information and profile picture management
- **Sign Up**: User registration with role selection and password strength validation
- **Verification**: OTP email verification
- **Login**: User authentication with "forgot password" link
- **Forgot Password**: Request password reset code via email
- **Reset Password**: Verify code and set new password
- **Checkout**: Stripe payment integration for ticket purchases
- **Order History**: View past orders and download tickets
- **Settings**: User preferences and theme management
- **Admin**: Admin-only dashboard with analytics
- **Organizer**: Event creation and management for organizers
- **User Management**: Admin panel to view, edit, suspend users and manage roles

## 🔧 Setup & Configuration

### Prerequisites

- Node.js 18+ and npm
- EventPro backend API running

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8080

# Stripe Configuration (for payment processing)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here

# Resend Configuration (for email notifications)
VITE_RESEND_API_KEY=re_your_api_key_here
```

#### Environment Variable Details

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | Yes | Backend API base URL (e.g., `http://localhost:8080` or `https://api.yourapp.com`) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Yes | Stripe publishable key for payment processing |
| `VITE_RESEND_API_KEY` | No | Resend API key for sending email notifications (optional) |

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🎨 Design System

The app uses a comprehensive design system with:

- **Primary Colors**: Vibrant blue-to-purple gradient
- **Accent Colors**: Warm orange for highlights
- **Semantic Tokens**: All colors defined in CSS variables
- **Custom Gradients**: `gradient-primary`, `gradient-hero`, `gradient-card`
- **Shadows**: Multiple shadow utilities including glow effects
- **Animations**: Smooth transitions with framer-motion

## 🔐 Authentication Flow

### Sign Up Flow

1. **Registration**: User creates account with email, password, and role selection
   - Password must meet complexity requirements (8+ chars, uppercase, lowercase, number, special char)
   - Real-time password strength indicator shown
2. **Email Verification**: User receives verification code via email from backend
3. **Verification**: User enters code on verification page
4. **Complete**: User redirected to login

### Login Flow

1. **Login**: User authenticates with credentials
2. **Backend Auth**: Backend validates credentials and returns JWT token
3. **Session**: Access token stored in localStorage for subsequent API calls
4. **Redirect**: User redirected to profile page

### Forgot Password Flow

1. **Request Reset**: User enters email on forgot password page
2. **Backend Sends Code**: Backend sends verification code via email
3. **Reset Password**: User enters code and new password
4. **Complete**: User redirected to login with new password

### Session Management

- Access tokens stored in localStorage
- Tokens automatically attached to API requests via Axios interceptor
- 401 responses trigger automatic logout and redirect to login
- Token expiration handled by backend JWT configuration

## 📱 Component Structure

```
src/
├── components/
│   ├── Navigation.tsx       # Responsive nav with hamburger menu
│   ├── ProtectedRoute.tsx   # HOC for route protection
│   └── ui/                  # Shadcn UI components
├── contexts/
│   └── AuthContext.tsx      # Global auth state management
├── lib/
│   ├── api.ts              # API service layer
│   └── utils.ts            # Utility functions
├── pages/
│   ├── Home.tsx            # Landing page
│   ├── Events.tsx          # Events listing
│   ├── Profile.tsx         # User profile dashboard
│   ├── SignUp.tsx          # Registration form
│   ├── Verify.tsx          # OTP verification
│   ├── Login.tsx           # Login form
│   └── Admin.tsx           # Admin dashboard
└── types/
    └── api.ts              # TypeScript type definitions
```

## 🛡️ Protected Routes

Routes are protected based on authentication status and user role:

```tsx
// Authenticated users only
<ProtectedRoute>
  <Profile />
</ProtectedRoute>

// Admin only
<ProtectedRoute allowedRoles={["ADMIN"]}>
  <Admin />
</ProtectedRoute>
```

## 🎯 Backend Integration

### Required Backend Endpoints

The frontend expects the following backend API endpoints to be implemented:

#### Authentication Endpoints

```
POST /api/v1/users/sync
- User data stored in backend database
- Body: None (uses JWT token)
- Response: { data: User }

POST /api/v1/auth/send-reset-email
- Sends password reset confirmation email
- Body: { email: string, code: string }
- Response: 200 OK
```

#### User Endpoints

```
GET /api/v1/users/me
- Get current user profile
- Headers: Authorization: Bearer {token}
- Response: { data: User }

PUT /api/v1/users/me
- Update current user profile
- Body: { firstName?, lastName?, phoneNumber?, bio?, location? }
- Response: { data: User }

POST /api/v1/users/upload-profile-picture
- Upload user profile picture
- Body: FormData with 'image' field
- Response: { data: { url: string } }
```

#### Event Endpoints

```
GET /api/v1/events?page=0&size=20
- List all events (paginated)
- Response: { data: { content: Event[] } }

GET /api/v1/events/{id}
- Get event details
- Response: { data: Event }

GET /api/v1/events/{id}/ticket-types
- Get ticket types for an event
- Response: { data: { content: TicketType[] } }

GET /api/v1/events/my-events
- Get events user has purchased tickets for
- Response: { data: { content: Event[] } }
```

#### Cart & Order Endpoints

```
POST /api/v1/cart/items
- Add items to cart
- Body: CartItem[]
- Response: 200 OK

GET /api/v1/cart
- Get current cart
- Response: { data: Cart }

POST /api/v1/orders
- Create order from cart
- Response: { data: Order }

GET /api/v1/orders/my-orders
- Get user's orders
- Response: { data: { content: Order[] } }

GET /api/v1/orders/{id}
- Get order details
- Response: { data: Order }

POST /api/v1/orders/{id}/refund
- Request refund for order
- Response: { data: Order }

GET /api/v1/tickets/{id}/download
- Download ticket as PDF
- Response: Blob (PDF file)
```

#### Payment Endpoints (Stripe)

```
POST /api/v1/payments/create-intent
- Create Stripe payment intent
- Body: { amount: number }
- Response: { data: { clientSecret: string } }

POST /api/v1/payments/confirm
- Confirm payment after Stripe processing
- Body: { paymentIntentId: string }
- Response: { data: Order }
```

#### Organizer Endpoints

```
GET /api/v1/organizer/events
- Get organizer's events
- Response: { data: { content: Event[] } }

POST /api/v1/organizer/events
- Create new event
- Body: Event data
- Response: { data: Event }

PUT /api/v1/organizer/events/{id}
- Update event
- Body: Event data
- Response: { data: Event }

POST /api/v1/organizer/events/upload-image
- Upload event image
- Body: FormData with 'image' field
- Response: { data: { url: string } }

GET /api/v1/organizer/events/{id}/stats
- Get event statistics
- Response: { data: EventStats }

GET /api/v1/organizer/events/{id}/attendees
- Get event attendees
- Response: { data: { content: Attendee[] } }

POST /api/v1/organizer/tickets/{id}/check-in
- Check in attendee
- Response: 200 OK
```

#### Admin Endpoints

```
GET /api/v1/admin/stats
- Get platform statistics
- Response: { data: Stats }

GET /api/v1/admin/event-sales
- Get event sales data
- Response: { data: { content: EventSale[] } }

GET /api/v1/admin/revenue?period=30d
- Get revenue data
- Response: { data: RevenueData[] }

GET /api/v1/admin/events
- Get all events (admin view)
- Response: { data: { content: Event[] } }

PATCH /api/v1/admin/events/{id}/status
- Update event status
- Body: { status: string }
- Response: { data: Event }
```

#### Admin User Management Endpoints

```
GET /api/v1/admin/users
- Get all users (admin view)
- Response: { data: { content: User[] } }

PUT /api/v1/admin/users/{id}
- Update user information
- Body: { firstName?, lastName?, phoneNumber?, bio?, location? }
- Response: { data: User }

PATCH /api/v1/admin/users/{id}/status
- Update user status (ACTIVE/SUSPENDED/PENDING_VERIFICATION)
- Body: { status: string }
- Response: { data: User }

PATCH /api/v1/admin/users/{id}/role
- Update user role (USER/ORGANIZER/ADMIN)
- Body: { role: string }
- Response: { data: User }
```

### API Authentication

All API calls (except public endpoints) automatically include the JWT token:

```
Authorization: Bearer {accessToken}
```

The token is stored in `localStorage` after successful login and automatically attached to requests via Axios interceptor.

### API Error Handling

- **401 Unauthorized**: Token expired or invalid → User redirected to login
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **500 Server Error**: Backend error

Errors are displayed to users via toast notifications.

## 🚢 Deployment

The app can be deployed to any static hosting service:

```bash
# Build production bundle
npm run build

# The dist/ folder contains deployable files
```

Recommended platforms:
- Vercel
- Netlify
- AWS Amplify
- Cloudflare Pages

## 📝 Development Notes

### Design System

- All colors use HSL format for consistency
- Design tokens defined in `src/index.css`
- Tailwind extended in `tailwind.config.ts`
- Use semantic tokens (e.g., `bg-primary`, `text-foreground`) instead of direct colors
- Custom gradients available: `gradient-primary`, `gradient-hero`, `gradient-card`

### Forms & Validation

- All forms use `react-hook-form` with `zod` validation
- Password fields include show/hide toggle and strength indicator
- Real-time validation feedback with error messages
- Form submission disabled during loading states

### State Management

- **AuthContext**: Global authentication state (user, tokens, login/logout)
- **CartContext**: Shopping cart state and operations
- **PreferencesContext**: User preferences (theme, etc.)
- **React Query**: Server state and caching for API data

### Error Handling

- API errors displayed via toast notifications (sonner)
- 401 errors trigger automatic logout and redirect
- Form validation errors shown inline
- Network errors caught and displayed to user

### Image Uploads

- Profile pictures and event images uploaded as FormData
- Backend expected to return `{ data: { url: string } }`
- Images displayed with fallback placeholders
- File size and type validation recommended

### TypeScript Types

- All API types defined in `src/types/api.ts`
- Strict type checking enabled
- API responses wrapped in `ApiResponse<T>` type
- Enums used for user roles and order statuses

## 🤝 Contributing

When contributing, please:
- Follow the existing design system
- Use semantic tokens for colors
- Maintain TypeScript type safety
- Test all user roles
- Ensure responsive design

## 📄 License

Proprietary - EventPro Team

---

Built with ❤️ using React, TypeScript, Tailwind CSS, and JWT authentication
