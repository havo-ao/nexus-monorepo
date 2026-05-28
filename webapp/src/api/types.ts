export type Genre = "MALE" | "FEMALE" | "NON_BINARY" | "OTHER";

export type TraderExperience = "BEGINNER" | "INTERMEDIATE" | "EXPERT";

export type LoginRequest = {
  email: string;
  password: string;
};

/** Matches `UserRol` in identity-service (same keys for every role). */
export type UserRol = "ADMIN" | "TRADER" | "CONSULTANT" | "LEGAL_USER";

/** Matches `UserResponse` JSON from login (and same shape across roles). */
export type UserProfile = {
  id: number;
  name: string;
  surname: string;
  email: string;
  username: string;
  userRol: UserRol;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserProfile;
};

export type TraderCreateRequest = {
  name: string;
  surname: string;
  genre: Genre;
  email: string;
  username: string;
  password: string;
  phone: string;
  address: string;
  nationalityCode: string;
  timeZone: string;
  experience: TraderExperience;
};

export type TraderResponse = Record<string, unknown>;
