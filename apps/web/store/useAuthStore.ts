import { create } from 'zustand';
import { User } from '@transora/shared';

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('transora_token') : null,
  setAuth: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('transora_token', token);
    }
    set({ user, token });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('transora_token');
    }
    set({ user: null, token: null });
  },
}));
