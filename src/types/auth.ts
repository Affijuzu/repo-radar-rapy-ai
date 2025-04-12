
export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export interface Credentials {
  email: string;
  password: string;
}

export interface RegisterData extends Credentials {
  name: string;
}
