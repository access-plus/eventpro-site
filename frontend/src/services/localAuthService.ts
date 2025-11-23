/**
 * Local Development Authentication Service
 * 
 * Provides mock authentication for local development when Cognito is not available.
 * This service generates mock JWT tokens that work with the backend's local JWT decoder.
 * 
 * Usage:
 * - Set VITE_LOCAL_AUTH_ENABLED=true in .env.local
 * - The authService will automatically use this mock implementation
 */

// Simple UUID-like generator for local development
const generateId = (): string => {
  return 'local-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Check if local auth is enabled
const isLocalAuthEnabled = (): boolean => {
  return import.meta.env['VITE_LOCAL_AUTH_ENABLED'] === 'true' || 
         (!import.meta.env['VITE_COGNITO_USER_POOL_ID'] || !import.meta.env['VITE_COGNITO_CLIENT_ID']);
};

/**
 * Generates a mock JWT token for local development.
 * The token contains standard Cognito claims that the backend expects.
 */
const generateMockJWT = (claims: Record<string, any>): string => {
  const header = {
    alg: 'none',
    typ: 'JWT',
  };

  // Build payload with proper defaults - use given_name/family_name (not firstName/lastName)
  const payload = {
    sub: claims['sub'] || `local-user-${generateId()}`,
    email: claims['email'] || 'dev@local.test',
    given_name: claims['given_name'] || claims['firstName'] || 'Local',
    family_name: claims['family_name'] || claims['lastName'] || 'Developer',
    'cognito:groups': claims['cognito:groups'] || claims['groups'] || ['USER'],
    iat: Math.floor(Date.now() / 1000) - 60,
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    ...claims, // Spread claims last to allow overrides
  };

  // Base64URL encode (without padding)
  const base64UrlEncode = (obj: any): string => {
    return btoa(JSON.stringify(obj))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  };

  const encodedHeader = base64UrlEncode(header);
  const encodedPayload = base64UrlEncode(payload);
  const signature = ''; // No signature for local dev

  return `${encodedHeader}.${encodedPayload}.${signature}`;
};

/**
 * Mock user storage (simulates Cognito user pool)
 */
interface MockUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  sub: string;
  groups: string[];
  confirmed: boolean;
}

const mockUsers: Map<string, MockUser> = new Map();

// Create a default test user
const defaultUser: MockUser = {
  email: 'dev@local.test',
  password: 'password123',
  firstName: 'Local',
  lastName: 'Developer',
  sub: 'local-user-123',
  groups: ['USER'],
  confirmed: true,
};
mockUsers.set(defaultUser.email, defaultUser);

export interface SignUpParams {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export interface SignInParams {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  idToken: string;
  refreshToken: string;
}

export interface CurrentUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  groups?: string[];
}

/**
 * Local Authentication Service Implementation
 */
export const localAuthService = {
  /**
   * Signs up a new user (mock implementation)
   */
  signUp: async (params: SignUpParams): Promise<any> => {
    if (mockUsers.has(params.email)) {
      throw new Error('User already exists');
    }

    const user: MockUser = {
      email: params.email,
      password: params.password, // In real app, this would be hashed
      firstName: params.firstName,
      lastName: params.lastName,
      phoneNumber: params.phoneNumber,
      sub: `local-user-${generateId()}`,
      groups: ['USER'],
      confirmed: true, // Auto-confirm for local dev
    };

    mockUsers.set(params.email, user);

    // Return mock CognitoUser-like object
    return {
      user: {
        getUsername: () => params.email,
      },
    };
  },

  /**
   * Signs in a user (mock implementation)
   */
  signIn: async (params: SignInParams): Promise<AuthTokens> => {
    const user = mockUsers.get(params.email);

    if (!user) {
      throw new Error('User does not exist');
    }

    if (user.password !== params.password) {
      throw new Error('Incorrect username or password');
    }

    // Generate mock tokens
    const idToken = generateMockJWT({
      sub: user.sub,
      email: user.email,
      given_name: user.firstName,
      family_name: user.lastName,
      'cognito:groups': user.groups,
    });

    const accessToken = generateMockJWT({
      sub: user.sub,
      email: user.email,
      given_name: user.firstName,
      family_name: user.lastName,
      phone_number: user.phoneNumber || undefined,
      'cognito:groups': user.groups,
      scope: 'aws.cognito.signin.user.admin',
    });

    const refreshToken = `mock-refresh-token-${generateId()}`;

    const tokens: AuthTokens = {
      accessToken,
      idToken,
      refreshToken,
    };

    // Store tokens
    localStorage.setItem('eventpro_access_token', tokens.accessToken);
    localStorage.setItem('eventpro_id_token', tokens.idToken);
    localStorage.setItem('eventpro_refresh_token', tokens.refreshToken);

    return tokens;
  },

  /**
   * Gets the current authenticated user
   */
  getCurrentUser: async (): Promise<CurrentUser | null> => {
    const idToken = localStorage.getItem('eventpro_id_token');
    if (!idToken) {
      return null;
    }

    try {
      // Parse JWT token
      const parts = idToken.split('.');
      if (parts.length < 2 || !parts[1]) {
        return null;
      }
      const payload = JSON.parse(atob(parts[1]));
      
      // Find user by email
      const user = Array.from(mockUsers.values()).find(u => u.email === payload.email);
      if (!user) {
        return null;
      }

      return {
        id: payload.sub,
        email: payload.email,
        firstName: payload.given_name,
        lastName: payload.family_name,
        groups: payload['cognito:groups'] || user.groups,
      };
    } catch (error) {
      console.error('Failed to parse token:', error);
      return null;
    }
  },

  /**
   * Signs out the current user
   */
  signOut: async (): Promise<void> => {
    localStorage.removeItem('eventpro_access_token');
    localStorage.removeItem('eventpro_id_token');
    localStorage.removeItem('eventpro_refresh_token');
  },

  /**
   * Refreshes authentication tokens
   */
  refreshTokens: async (): Promise<AuthTokens> => {
    const refreshToken = localStorage.getItem('eventpro_refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const idToken = localStorage.getItem('eventpro_id_token');
    if (!idToken) {
      throw new Error('No ID token available');
    }

    try {
      const parts = idToken.split('.');
      if (parts.length < 2 || !parts[1]) {
        throw new Error('Invalid token format');
      }
      const payload = JSON.parse(atob(parts[1]));
      const user = Array.from(mockUsers.values()).find(u => u.email === payload.email);
      
      if (!user) {
        throw new Error('User not found');
      }

      // Generate new tokens
      const newIdToken = generateMockJWT({
        sub: user.sub,
        email: user.email,
        given_name: user.firstName,
        family_name: user.lastName,
        'cognito:groups': user.groups,
      });

      const newAccessToken = generateMockJWT({
        sub: user.sub,
        email: user.email,
        given_name: user.firstName,
        family_name: user.lastName,
        phone_number: user.phoneNumber || undefined,
        'cognito:groups': user.groups,
        scope: 'aws.cognito.signin.user.admin',
      });

      const tokens: AuthTokens = {
        accessToken: newAccessToken,
        idToken: newIdToken,
        refreshToken,
      };

      // Store new tokens
      localStorage.setItem('eventpro_access_token', tokens.accessToken);
      localStorage.setItem('eventpro_id_token', tokens.idToken);
      localStorage.setItem('eventpro_refresh_token', tokens.refreshToken);

      return tokens;
    } catch (error) {
      throw new Error('Failed to refresh tokens: ' + (error as Error).message);
    }
  },

  /**
   * Ensures valid tokens (refreshes if needed)
   */
  ensureValidTokens: async (): Promise<AuthTokens> => {
    const idToken = localStorage.getItem('eventpro_id_token');
    if (!idToken) {
      throw new Error('No authenticated user found');
    }

    try {
      const parts = idToken.split('.');
      if (parts.length < 2 || !parts[1]) {
        throw new Error('Invalid token format');
      }
      const payload = JSON.parse(atob(parts[1]));
      const exp = payload.exp;
      const now = Math.floor(Date.now() / 1000);

      // If token expires in less than 5 minutes, refresh it
      if (exp - now < 300) {
        return await localAuthService.refreshTokens();
      }

      // Token is still valid
      const accessToken = localStorage.getItem('eventpro_access_token') || '';
      const refreshToken = localStorage.getItem('eventpro_refresh_token') || '';

      return {
        accessToken,
        idToken,
        refreshToken,
      };
    } catch (error) {
      throw new Error('Failed to ensure valid tokens: ' + (error as Error).message);
    }
  },

  /**
   * Gets stored tokens
   */
  getStoredTokens: (): AuthTokens | null => {
    const accessToken = localStorage.getItem('eventpro_access_token');
    const idToken = localStorage.getItem('eventpro_id_token');
    const refreshToken = localStorage.getItem('eventpro_refresh_token');

    if (!accessToken || !idToken || !refreshToken) {
      return null;
    }

    return { accessToken, idToken, refreshToken };
  },

  /**
   * Stores tokens
   */
  storeTokens: (tokens: AuthTokens): void => {
    localStorage.setItem('eventpro_access_token', tokens.accessToken);
    localStorage.setItem('eventpro_id_token', tokens.idToken);
    localStorage.setItem('eventpro_refresh_token', tokens.refreshToken);
  },

  /**
   * Clears stored tokens
   */
  clearStoredTokens: (): void => {
    localStorage.removeItem('eventpro_access_token');
    localStorage.removeItem('eventpro_id_token');
    localStorage.removeItem('eventpro_refresh_token');
  },
};

/**
 * Check if local auth should be used
 */
export const shouldUseLocalAuth = (): boolean => {
  return isLocalAuthEnabled();
};

