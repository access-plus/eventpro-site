import {
  CognitoUserPool,
  CognitoUser,
  CognitoUserAttribute,
  AuthenticationDetails,
  CognitoUserSession,
  CognitoIdToken,
  CognitoRefreshToken,
  type ICognitoUserPoolData,
} from 'amazon-cognito-identity-js';

/**
 * Configuration for AWS Cognito User Pool.
 * Reads from environment variables (Vite automatically exposes VITE_* variables).
 */
const getCognitoConfig = (): ICognitoUserPoolData => {
  const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID;
  const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID;

  if (!userPoolId || !clientId) {
    throw new Error(
      'Cognito configuration is missing. Please set VITE_COGNITO_USER_POOL_ID and VITE_COGNITO_CLIENT_ID environment variables.'
    );
  }

  return {
    UserPoolId: userPoolId,
    ClientId: clientId,
  };
};

/**
 * Cognito User Pool instance.
 * Initialized once and reused for all authentication operations.
 */
let userPool: CognitoUserPool | null = null;

/**
 * Gets or creates the Cognito User Pool instance.
 * 
 * @returns CognitoUserPool instance
 * @throws Error if Cognito configuration is missing
 */
const getUserPool = (): CognitoUserPool => {
  if (!userPool) {
    const config = getCognitoConfig();
    userPool = new CognitoUserPool(config);
  }
  return userPool;
};

/**
 * Gets the current authenticated Cognito user.
 * 
 * @returns CognitoUser instance if authenticated, null otherwise
 */
const getCurrentCognitoUser = (): CognitoUser | null => {
  const pool = getUserPool();
  return pool.getCurrentUser();
};

/**
 * LocalStorage keys for token storage.
 */
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'eventpro_access_token',
  ID_TOKEN: 'eventpro_id_token',
  REFRESH_TOKEN: 'eventpro_refresh_token',
} as const;

/**
 * Stores authentication tokens in localStorage.
 * 
 * @param tokens Authentication tokens to store
 */
const storeTokens = (tokens: AuthTokens): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
    localStorage.setItem(STORAGE_KEYS.ID_TOKEN, tokens.idToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
  } catch (error) {
    console.error('Failed to store tokens in localStorage:', error);
    throw new Error('Failed to store authentication tokens');
  }
};

/**
 * Retrieves authentication tokens from localStorage.
 * 
 * @returns Authentication tokens if found, null otherwise
 */
const getStoredTokens = (): AuthTokens | null => {
  try {
    const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const idToken = localStorage.getItem(STORAGE_KEYS.ID_TOKEN);
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

    if (!accessToken || !idToken || !refreshToken) {
      return null;
    }

    return {
      accessToken,
      idToken,
      refreshToken,
    };
  } catch (error) {
    console.error('Failed to retrieve tokens from localStorage:', error);
    return null;
  }
};

/**
 * Clears authentication tokens from localStorage.
 */
const clearStoredTokens = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.ID_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  } catch (error) {
    console.error('Failed to clear tokens from localStorage:', error);
  }
};

/**
 * Type definitions for authentication methods.
 */
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
 * Signs up a new user in Cognito.
 * 
 * @param params User registration parameters
 * @returns Promise that resolves with the CognitoUser if successful
 * @throws Error if signup fails
 */
const signUp = async (params: SignUpParams): Promise<CognitoUser> => {
  const pool = getUserPool();

  // Build user attributes
  const attributes: CognitoUserAttribute[] = [
    new CognitoUserAttribute({ Name: 'email', Value: params.email }),
    new CognitoUserAttribute({ Name: 'given_name', Value: params.firstName }),
    new CognitoUserAttribute({ Name: 'family_name', Value: params.lastName }),
  ];

  // Add phone number if provided
  if (params.phoneNumber) {
    attributes.push(
      new CognitoUserAttribute({ Name: 'phone_number', Value: params.phoneNumber })
    );
  }

  return new Promise((resolve, reject) => {
    pool.signUp(
      params.email,
      params.password,
      attributes,
      [],
      (err, result) => {
        if (err) {
          reject(new Error(err.message || 'Sign up failed'));
          return;
        }

        if (!result || !result.user) {
          reject(new Error('Sign up failed: No user returned'));
          return;
        }

        resolve(result.user);
      }
    );
  });
};

/**
 * Signs in a user with email and password.
 * 
 * @param params Sign in parameters (email and password)
 * @returns Promise that resolves with authentication tokens
 * @throws Error if sign in fails
 */
const signIn = async (params: SignInParams): Promise<AuthTokens> => {
  const pool = getUserPool();
  const authenticationDetails = new AuthenticationDetails({
    Username: params.email,
    Password: params.password,
  });

  const cognitoUser = new CognitoUser({
    Username: params.email,
    Pool: pool,
  });

  return new Promise((resolve, reject) => {
    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (result) => {
        const tokens: AuthTokens = {
          accessToken: result.getAccessToken().getJwtToken(),
          idToken: result.getIdToken().getJwtToken(),
          refreshToken: result.getRefreshToken().getToken(),
        };
        // Store tokens in localStorage
        storeTokens(tokens);
        resolve(tokens);
      },
      onFailure: (err) => {
        reject(new Error(err.message || 'Sign in failed'));
      },
      newPasswordRequired: (_userAttributes, _requiredAttributes) => {
        // User needs to set a new password (first time login or password reset)
        reject(new Error('New password required. Please use the password change flow.'));
      },
    });
  });
};

/**
 * Gets the current authenticated user's information.
 * 
 * @returns Promise that resolves with CurrentUser if authenticated, null otherwise
 * @throws Error if session retrieval fails
 */
const getCurrentUser = async (): Promise<CurrentUser | null> => {
  const cognitoUser = getCurrentCognitoUser();
  
  if (!cognitoUser) {
    return null;
  }

  return new Promise((resolve, reject) => {
    cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err) {
        reject(new Error(err.message || 'Failed to get user session'));
        return;
      }

      if (!session || !session.isValid()) {
        resolve(null);
        return;
      }

      // Get ID token to extract user information
      const idToken: CognitoIdToken = session.getIdToken();
      const payload = idToken.payload;

      // Extract user information from token payload
      const user: CurrentUser = {
        id: payload['sub'] || payload['cognito:username'] || '',
        email: payload['email'] || '',
        firstName: payload['given_name'] || undefined,
        lastName: payload['family_name'] || undefined,
        phoneNumber: payload['phone_number'] || undefined,
        groups: payload['cognito:groups'] || undefined,
      };

      resolve(user);
    });
  });
};

/**
 * Refreshes the authentication tokens using the refresh token.
 * 
 * @returns Promise that resolves with new authentication tokens
 * @throws Error if refresh fails or no refresh token is available
 */
const refreshTokens = async (): Promise<AuthTokens> => {
  const cognitoUser = getCurrentCognitoUser();
  
  if (!cognitoUser) {
    throw new Error('No authenticated user found');
  }

  // Get stored tokens to retrieve refresh token
  const storedTokens = getStoredTokens();
  if (!storedTokens || !storedTokens.refreshToken) {
    throw new Error('No refresh token available');
  }

  const refreshToken = new CognitoRefreshToken({
    RefreshToken: storedTokens.refreshToken,
  });

  return new Promise((resolve, reject) => {
    cognitoUser.refreshSession(refreshToken, (err: Error | null, session: CognitoUserSession | null) => {
      if (err) {
        // Clear tokens if refresh fails
        clearStoredTokens();
        reject(new Error(err.message || 'Failed to refresh tokens'));
        return;
      }

      if (!session || !session.isValid()) {
        clearStoredTokens();
        reject(new Error('Invalid session after refresh'));
        return;
      }

      // Extract new tokens from refreshed session
      const tokens: AuthTokens = {
        accessToken: session.getAccessToken().getJwtToken(),
        idToken: session.getIdToken().getJwtToken(),
        refreshToken: session.getRefreshToken().getToken(),
      };

      // Store new tokens in localStorage
      storeTokens(tokens);
      resolve(tokens);
    });
  });
};

/**
 * Checks if the current session is valid and refreshes tokens if needed.
 * 
 * @returns Promise that resolves with valid authentication tokens
 * @throws Error if session cannot be validated or refreshed
 */
const ensureValidTokens = async (): Promise<AuthTokens> => {
  const cognitoUser = getCurrentCognitoUser();
  
  if (!cognitoUser) {
    throw new Error('No authenticated user found');
  }

  return new Promise((resolve, reject) => {
    cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err) {
        // Try to refresh tokens if session retrieval fails
        refreshTokens()
          .then(resolve)
          .catch(reject);
        return;
      }

      if (!session || !session.isValid()) {
        // Try to refresh tokens if session is invalid
        refreshTokens()
          .then(resolve)
          .catch(reject);
        return;
      }

      // Session is valid, extract tokens
      const tokens: AuthTokens = {
        accessToken: session.getAccessToken().getJwtToken(),
        idToken: session.getIdToken().getJwtToken(),
        refreshToken: session.getRefreshToken().getToken(),
      };

      // Update stored tokens to ensure they're in sync
      storeTokens(tokens);
      resolve(tokens);
    });
  });
};

/**
 * Signs out the current user.
 * 
 * @returns Promise that resolves when sign out is complete
 */
const signOut = async (): Promise<void> => {
  const cognitoUser = getCurrentCognitoUser();
  
  if (cognitoUser) {
    return new Promise((resolve) => {
      cognitoUser.signOut(() => {
        // Clear stored tokens from localStorage
        clearStoredTokens();
        resolve();
      });
    });
  }
  
  // Clear tokens even if no Cognito user is found
  clearStoredTokens();
  
  // No user to sign out
  return Promise.resolve();
};

/**
 * Authentication Service for AWS Cognito.
 * 
 * Provides methods for:
 * <ul>
 *   <li>User registration (signUp)</li>
 *   <li>User authentication (signIn)</li>
 *   <li>User sign out (signOut)</li>
 *   <li>Getting current user (getCurrentUser)</li>
 *   <li>Token management (storage and retrieval)</li>
 *   <li>Token refresh</li>
 * </ul>
 * 
 * <p>Requires VITE_COGNITO_USER_POOL_ID and VITE_COGNITO_CLIENT_ID environment variables.
 */
export const authService = {
  /**
   * Gets the Cognito User Pool instance.
   * 
   * @returns CognitoUserPool instance
   * @throws Error if Cognito configuration is missing
   */
  getUserPool,

  /**
   * Gets the current authenticated Cognito user.
   * 
   * @returns CognitoUser instance if authenticated, null otherwise
   */
  getCurrentCognitoUser,

  /**
   * Signs up a new user in Cognito.
   * 
   * @param params User registration parameters
   * @returns Promise that resolves with the CognitoUser if successful
   * @throws Error if signup fails
   */
  signUp,

  /**
   * Signs in a user with email and password.
   * 
   * @param params Sign in parameters (email and password)
   * @returns Promise that resolves with authentication tokens
   * @throws Error if sign in fails
   */
  signIn,

  /**
   * Gets the current authenticated user's information.
   * 
   * @returns Promise that resolves with CurrentUser if authenticated, null otherwise
   * @throws Error if session retrieval fails
   */
  getCurrentUser,

  /**
   * Signs out the current user.
   * 
   * @returns Promise that resolves when sign out is complete
   */
  signOut,

  /**
   * Stores authentication tokens in localStorage.
   * 
   * @param tokens Authentication tokens to store
   */
  storeTokens,

  /**
   * Retrieves authentication tokens from localStorage.
   * 
   * @returns Authentication tokens if found, null otherwise
   */
  getStoredTokens,

  /**
   * Clears authentication tokens from localStorage.
   */
  clearStoredTokens,

  /**
   * Refreshes the authentication tokens using the refresh token.
   * 
   * @returns Promise that resolves with new authentication tokens
   * @throws Error if refresh fails or no refresh token is available
   */
  refreshTokens,

  /**
   * Checks if the current session is valid and refreshes tokens if needed.
   * 
   * @returns Promise that resolves with valid authentication tokens
   * @throws Error if session cannot be validated or refreshed
   */
  ensureValidTokens,
};

