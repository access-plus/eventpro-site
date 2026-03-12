import type { EventProApi, User } from "@eventpro/shared";

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  Verify: undefined;
  ResetPassword: { token?: string } | undefined;
};

export type DiscoverStackParamList = {
  Home: undefined;
  EventsList: undefined;
  EventDetail: { eventId: string };
  Checkout: { eventId?: string };
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  ProfileEdit: undefined;
  Settings: undefined;
  Notifications: undefined;
  OrderHistory: undefined;
  Pricing: undefined;
  Privacy: undefined;
};

export type OrganizerStackParamList = {
  OrganizerDashboard: undefined;
  OrganizerEventDetail: { eventId: string };
  EventTickets: { eventId: string };
  EventEnhancements: { eventId: string };
  CheckIn: { eventId?: string; scannedTicketId?: string };
  QRScanner: { eventId?: string };
};

export type AdminStackParamList = {
  AdminOverview: undefined;
  AdminStats: undefined;
  AdminUsers: undefined;
  AdminVerification: undefined;
  AdminEvents: undefined;
  AdminEventSales: undefined;
  AdminRevenue: undefined;
  AdminSubscriptionPayments: undefined;
};

export type MainTabParamList = {
  Discover: undefined;
  Profile: undefined;
  Organizer: undefined;
  Admin: undefined;
};
