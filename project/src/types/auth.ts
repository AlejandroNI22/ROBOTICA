export interface User {
  id: string;
  username: string;
  role: 'admin' | 'editor' | 'viewer';
  name: string;
  createdAt: Date;
  lastLogin?: Date;
  isActive: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface CreateUserData {
  username: string;
  password: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
}