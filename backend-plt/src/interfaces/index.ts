interface User {
  id: string;
  email: string;
  avatar: string; // Optional avatar field
  username: string;
  fullname: string;
  password: string; // Optional for OAuth users
}

interface UserFirebase {
  uid: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture: string;
  iss: string;
  aud: string;
  auth_time: number;
  user_id: string;
  sub: string;
  iat: number;
  exp: number;
  firebase?: {
    identities?: Record<string, string[]>;
    sign_in_provider?: string;
  };
  // Additional fields can be added as needed
  // For example, if you want to include phone number or other OAuth-specific fields
  phone_number?: string;
  provider_id?: string;
  provider_data?: Array<{
    providerId: string;
    uid: string;
    displayName?: string;
    email?: string;
    phoneNumber?: string;
    photoURL?: string;
  }>;
  // Note: The above fields are optional and depend on the OAuth provider's response
}
export { User, UserFirebase };