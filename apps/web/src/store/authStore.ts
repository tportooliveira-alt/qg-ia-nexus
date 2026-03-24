import { create } from 'zustand'

interface AuthState {
  token: string | null
  isAuthenticated: boolean
  login: (token: string) => void
  logout: () => void
}

const STORAGE_KEY = 'qg_auth_token'

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem(STORAGE_KEY),
  isAuthenticated: !!localStorage.getItem(STORAGE_KEY),

  login: (token) => {
    localStorage.setItem(STORAGE_KEY, token)
    set({ token, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY)
    set({ token: null, isAuthenticated: false })
  },
}))
