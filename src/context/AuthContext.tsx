import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import api from '../lib/api'

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'STUDENT'

export interface AuthUser {
  id: string
  username: string
  email: string
  role: UserRole
  isFirstLogin: boolean
  fullName?: string
  employeeId?: string
  studentId?: string
}

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  login: (email: string, password: string, role: UserRole) => Promise<void>
  logout: () => void
  isLoading: boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: async () => {},
  logout: () => {},
  isLoading: true,
  refreshUser: async () => {},
})

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('pw-token')
    if (stored) {
      setToken(stored)
      api.defaults.headers.common['Authorization'] = `Bearer ${stored}`
      api.get('/auth/me')
        .then(res => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('pw-token')
          setToken(null)
        })
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (email: string, password: string, role: UserRole) => {
    const res = await api.post('/auth/login', { email, password, role })
    const { token: newToken, user: userData } = res.data
    localStorage.setItem('pw-token', newToken)
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
    setToken(newToken)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('pw-token')
    delete api.defaults.headers.common['Authorization']
    setToken(null)
    setUser(null)
  }

  const refreshUser = async () => {
    const res = await api.get('/auth/me')
    setUser(res.data)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
