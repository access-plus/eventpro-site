import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  GetUserCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  AuthFlowType,
} from "@aws-sdk/client-cognito-identity-provider";
import type { SignUpRequest, VerifyEmailRequest, LoginRequest, LoginResponse } from "@/types/api";

const getUserPoolId = () => {
  const poolId = import.meta.env.VITE_COGNITO_USER_POOL_ID;
  if (!poolId) {
    throw new Error("VITE_COGNITO_USER_POOL_ID is not configured");
  }
  return poolId;
};

const getClientId = () => {
  const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID;
  if (!clientId) {
    throw new Error("VITE_COGNITO_CLIENT_ID is not configured");
  }
  return clientId;
};

const getRegionFromPoolId = (poolId: string) => {
  return poolId.split("_")[0];
};

const createCognitoClient = () => {
  const poolId = getUserPoolId();
  const region = getRegionFromPoolId(poolId);
  
  return new CognitoIdentityProviderClient({
    region,
  });
};

export const cognitoService = {
  async signUp(data: SignUpRequest): Promise<{ userSub: string }> {
    const client = createCognitoClient();
    const clientId = getClientId();

    const userAttributes = [
      { Name: "email", Value: data.email },
    ];

    if (data.firstName) {
      userAttributes.push({ Name: "given_name", Value: data.firstName });
    }
    if (data.lastName) {
      userAttributes.push({ Name: "family_name", Value: data.lastName });
    }
    if (data.phoneNumber) {
      userAttributes.push({ Name: "phone_number", Value: data.phoneNumber });
    }
    if (data.role) {
      userAttributes.push({ Name: "custom:role", Value: data.role });
    }

    const command = new SignUpCommand({
      ClientId: clientId,
      Username: data.email,
      Password: data.password,
      UserAttributes: userAttributes,
    });

    const response = await client.send(command);
    return { userSub: response.UserSub || "" };
  },

  async verifyEmail(data: VerifyEmailRequest): Promise<void> {
    const client = createCognitoClient();
    const clientId = getClientId();

    const command = new ConfirmSignUpCommand({
      ClientId: clientId,
      Username: data.email,
      ConfirmationCode: data.code,
    });

    await client.send(command);
  },

  async login(data: LoginRequest): Promise<LoginResponse> {
    const client = createCognitoClient();
    const clientId = getClientId();

    const command = new InitiateAuthCommand({
      AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
      ClientId: clientId,
      AuthParameters: {
        USERNAME: data.email,
        PASSWORD: data.password,
      },
    });

    const response = await client.send(command);

    if (!response.AuthenticationResult) {
      throw new Error("Authentication failed");
    }

    return {
      accessToken: response.AuthenticationResult.AccessToken || "",
      refreshToken: response.AuthenticationResult.RefreshToken || "",
      expiresIn: response.AuthenticationResult.ExpiresIn || 3600,
    };
  },

  async getCurrentUser(accessToken: string) {
    const client = createCognitoClient();

    const command = new GetUserCommand({
      AccessToken: accessToken,
    });

    const response = await client.send(command);
    return response;
  },

  async forgotPassword(email: string): Promise<void> {
    const client = createCognitoClient();
    
    try {
      const command = new ForgotPasswordCommand({
        ClientId: getClientId(),
        Username: email,
      });
      
      await client.send(command);
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  },

  async resetPassword(email: string, code: string, newPassword: string): Promise<void> {
    const client = createCognitoClient();
    
    try {
      const command = new ConfirmForgotPasswordCommand({
        ClientId: getClientId(),
        Username: email,
        ConfirmationCode: code,
        Password: newPassword,
      });
      
      await client.send(command);
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  },
};
